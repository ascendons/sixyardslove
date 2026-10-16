package com.ascendons.order.service;

import com.ascendons.cart.entity.Cart;
import com.ascendons.cart.entity.CartItem;
import com.ascendons.cart.repository.CartItemRepository;
import com.ascendons.cart.repository.CartRepository;
import com.ascendons.exception.BadRequestException;
import com.ascendons.exception.InsufficientStockException;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.inventory.entity.Inventory;
import com.ascendons.inventory.entity.InventoryMovement;
import com.ascendons.inventory.repository.InventoryMovementRepository;
import com.ascendons.inventory.repository.InventoryRepository;
import com.ascendons.order.dto.OrderResponse;
import com.ascendons.order.dto.OrderTrackingResponse;
import com.ascendons.order.dto.PlaceOrderRequest;
import com.ascendons.order.dto.BuyNowRequest;
import com.ascendons.order.dto.UpdateOrderStatusRequest;
import com.ascendons.catalog.entity.ProductVariant;
import com.ascendons.catalog.repository.ProductVariantRepository;
import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderItem;
import com.ascendons.order.entity.OrderBoxAssignment;
import com.ascendons.order.entity.OrderStatus;
import com.ascendons.order.entity.Shipment;
import com.ascendons.order.repository.OrderBoxAssignmentRepository;
import com.ascendons.order.mapper.OrderMapper;
import com.ascendons.order.repository.OrderItemRepository;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.order.repository.ShipmentRepository;
import com.ascendons.shipping.service.PackagingService;
// Shiprocket imports paused — re-enable when Shiprocket integration is resumed
// import com.ascendons.shiprocket.dto.ShiprocketTrackResponse;
// import com.ascendons.shiprocket.service.ShiprocketService;
import com.ascendons.geo.context.GeoContext;
import com.ascendons.geo.dto.TaxBreakdown;
import com.ascendons.geo.entity.Currency;
import com.ascendons.geo.service.CurrencyService;
import com.ascendons.geo.service.TaxService;
import com.ascendons.coupon.service.CouponService;
import com.ascendons.email.EmailService;
import com.ascendons.user.entity.User;
import com.ascendons.user.entity.UserAddress;
import com.ascendons.user.repository.UserAddressRepository;
import com.ascendons.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.ascendons.order.repository.OrderSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository addressRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderMapper orderMapper;
    private final CurrencyService currencyService;
    private final TaxService taxService;
    private final CouponService couponService;
    private final GeoContext geoContext;
    private final ShipmentRepository shipmentRepository;
    // private final ShiprocketService shiprocketService; // paused
    private final EmailService emailService;
    private final PackagingService packagingService;
    private final OrderBoxAssignmentRepository boxAssignmentRepository;

    // Valid admin status transitions — terminal states and backwards jumps are blocked
    private static final java.util.Map<OrderStatus, java.util.Set<OrderStatus>> VALID_TRANSITIONS = java.util.Map.of(
        OrderStatus.PENDING,     java.util.Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
        OrderStatus.CONFIRMED,   java.util.Set.of(OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED),
        OrderStatus.PROCESSING,  java.util.Set.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
        OrderStatus.SHIPPED,     java.util.Set.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
        OrderStatus.DELIVERED,   java.util.Set.of(OrderStatus.CANCELLED),
        OrderStatus.CANCELLED,   java.util.Set.of()
    );

    @Transactional
    public OrderResponse placeOrder(UUID userId, PlaceOrderRequest request) {
        log.info("Placing order for user: {}", userId);
        log.debug("Order request: {}", request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserAddress address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));
        log.info("Cart: {}", cart);
        List<CartItem> cartItems = cart.getItems();
        if (cartItems == null || cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }
        log.info("Cart items: {}", cartItems);
        List<OrderItemData> itemData = cartItems.stream()
                .map(item -> new OrderItemData(item.getProductVariant(), item.getQuantity()))
                .toList();
        log.info("Item data: {}", itemData);
        OrderResponse response = executeOrderPlacement(user, address, itemData, request.getCurrencyCode(), request.getCouponCode(), request.getIsBulk(), request.getShippingFee(), request.getPreferredCourierId());
        log.info("Order response: {}", response);
        // Clear cart immediately on order placement
        try {
            cartItemRepository.deleteAll(cart.getItems());
            log.info("Cart cleared for user {} after order placement", userId);
        } catch (Exception e) {
            log.warn("Failed to clear cart for user {} after order placement: {}", userId, e.getMessage());
        }
        return response;
    }

    @Transactional
    public OrderResponse placeBuyNowOrder(UUID userId, BuyNowRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserAddress address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        ProductVariant variant = productVariantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", request.getProductVariantId()));

        List<OrderItemData> itemData = List.of(new OrderItemData(variant, request.getQuantity()));

        return executeOrderPlacement(user, address, itemData, request.getCurrencyCode(), request.getCouponCode(), request.getIsBulk(), request.getShippingFee(), null);
    }

    private record InventoryDelta(UUID variantId, int quantityChange, String reason) {}

    private OrderResponse executeOrderPlacement(User user, UserAddress address, List<OrderItemData> items, String currencyCode, String couponCode, Boolean isBulk, BigDecimal shippingFeeParam, Long preferredCourierId) {
        // Sort by variant ID to prevent deadlock — all concurrent transactions lock rows in the same order
        log.info("Executing order placement for user: {}", user);
        log.info("Order items: {}", items);
        List<OrderItemData> sortedItems = items.stream()
                .sorted((a, b) -> a.variant.getId().compareTo(b.variant.getId()))
                .toList();
        log.info("Sorted items: {}", sortedItems);

        // Validate and hold inventory (pessimistic lock to prevent overselling)
        for (OrderItemData item : sortedItems) {
            Inventory inventory = inventoryRepository.findByIdForUpdate(item.variant.getId())
                    .orElseThrow(() -> new InsufficientStockException(
                            "No inventory for variant: " + item.variant.getSku()));
            log.info("Inventory: {}", inventory);
            if (inventory.getQuantity() < item.quantity) {
                throw new InsufficientStockException(
                        "Insufficient stock for " + item.variant.getSku()
                                + ". Available: " + inventory.getQuantity()
                                + ", Requested: " + item.quantity);
            }
        }

        // Resolve target currency
        Currency baseCurrency = currencyService.getBaseCurrency();
        String targetCurrencyCode = currencyCode;
        if (targetCurrencyCode == null || targetCurrencyCode.isBlank()) {
            targetCurrencyCode = geoContext.getCurrencyCode();
        }
        if (targetCurrencyCode == null || targetCurrencyCode.isBlank()) {
            targetCurrencyCode = baseCurrency.getCode();
        }
        Currency targetCurrency = currencyService.getCurrencyByCode(targetCurrencyCode);

        String countryCode = geoContext.getCountryCode() != null ? geoContext.getCountryCode() : "IN";
        log.info("Order items: {}", items);
        // Create order
        boolean isBulkOrder = Boolean.TRUE.equals(isBulk);
        Order order = Order.builder()
                .user(user)
                .address(address)
                .status(OrderStatus.PENDING)
                .isBulk(isBulkOrder)
                .totalAmount(BigDecimal.ZERO)
                .currency(targetCurrencyCode)
                .exchangeRate(targetCurrency.getExchangeRate())
                .taxAmount(BigDecimal.ZERO)
                .expiresAt(OffsetDateTime.now().plusMinutes(30))
                .invoiceSeq(orderRepository.nextInvoiceSeq())
                .build();
        log.info("Order: {}", order);
        Set<OrderItem> orderItems = new HashSet<>();
        BigDecimal orderTaxTotal = BigDecimal.ZERO;
        BigDecimal orderSubtotal = BigDecimal.ZERO;
        BigDecimal orderCgstTotal = BigDecimal.ZERO;
        BigDecimal orderSgstTotal = BigDecimal.ZERO;
        BigDecimal orderIgstTotal = BigDecimal.ZERO;

        // Collect changes — none flushed until end-of-method for atomicity
        List<InventoryDelta> inventoryDeltas = new ArrayList<>();
        log.info("Order items: {}", items);
        for (OrderItemData item : sortedItems) {
            // MOQ validation for bulk orders
            if (isBulkOrder && item.variant.getMoq() != null && item.quantity < item.variant.getMoq()) {
                throw new BadRequestException("Quantity for " + item.variant.getSku() + " is below Minimum Order Quantity (MOQ) of " + item.variant.getMoq());
            }

            BigDecimal itemPrice = item.variant.getPrice();
            if (isBulkOrder && item.variant.getBulkOrderPrice() != null) {
                itemPrice = item.variant.getBulkOrderPrice();
            }

            UUID productId = item.variant.getProduct().getId();
            BigDecimal itemSubtotal = itemPrice.multiply(BigDecimal.valueOf(item.quantity));

            TaxBreakdown taxBreakdown = taxService.calculateTax(productId, countryCode, address.getState(), itemSubtotal);

            BigDecimal itemTaxConverted = currencyService.convert(taxBreakdown.getTaxAmount(), baseCurrency.getCode(), targetCurrencyCode);
            BigDecimal itemCgstConverted = taxBreakdown.getCgstAmount() != null ? currencyService.convert(taxBreakdown.getCgstAmount(), baseCurrency.getCode(), targetCurrencyCode) : null;
            BigDecimal itemSgstConverted = taxBreakdown.getSgstAmount() != null ? currencyService.convert(taxBreakdown.getSgstAmount(), baseCurrency.getCode(), targetCurrencyCode) : null;
            BigDecimal itemIgstConverted = taxBreakdown.getIgstAmount() != null ? currencyService.convert(taxBreakdown.getIgstAmount(), baseCurrency.getCode(), targetCurrencyCode) : null;

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productVariant(item.variant)
                    .price(itemPrice)
                    .quantity(item.quantity)
                    .taxRate(taxBreakdown.getTaxRate())
                    .taxAmount(itemTaxConverted)
                    .cgstAmount(itemCgstConverted)
                    .sgstAmount(itemSgstConverted)
                    .igstAmount(itemIgstConverted)
                    .build();
            orderItems.add(orderItem);

            orderSubtotal = orderSubtotal.add(itemSubtotal);
            orderTaxTotal = orderTaxTotal.add(taxBreakdown.getTaxAmount());
            if (taxBreakdown.getCgstAmount() != null) orderCgstTotal = orderCgstTotal.add(taxBreakdown.getCgstAmount());
            if (taxBreakdown.getSgstAmount() != null) orderSgstTotal = orderSgstTotal.add(taxBreakdown.getSgstAmount());
            if (taxBreakdown.getIgstAmount() != null) orderIgstTotal = orderIgstTotal.add(taxBreakdown.getIgstAmount());

            // Record deduction — will be applied atomically with order at end of method
            inventoryDeltas.add(new InventoryDelta(
                    item.variant.getId(),
                    item.quantity,
                    "Order placed: " + order.getId()));
        }
        log.info("Order subtotal: {}", orderSubtotal);
        log.info("Order tax total: {}", orderTaxTotal);
        log.info("Order cgst total: {}", orderCgstTotal);
        log.info("Order sgst total: {}", orderSgstTotal);
        log.info("Order igst total: {}", orderIgstTotal);
        // Tax is INCLUSIVE in the product price — do not add it on top of the subtotal
        BigDecimal totalInBase = orderSubtotal;
        BigDecimal taxAmountConverted = currencyService.convert(orderTaxTotal, baseCurrency.getCode(), targetCurrencyCode);
        BigDecimal cgstTotalConverted = orderCgstTotal.compareTo(BigDecimal.ZERO) > 0 ? currencyService.convert(orderCgstTotal, baseCurrency.getCode(), targetCurrencyCode) : null;
        BigDecimal sgstTotalConverted = orderSgstTotal.compareTo(BigDecimal.ZERO) > 0 ? currencyService.convert(orderSgstTotal, baseCurrency.getCode(), targetCurrencyCode) : null;
        BigDecimal igstTotalConverted = orderIgstTotal.compareTo(BigDecimal.ZERO) > 0 ? currencyService.convert(orderIgstTotal, baseCurrency.getCode(), targetCurrencyCode) : null;

        // Apply Coupon (if not bulk order)
        BigDecimal couponDiscount = BigDecimal.ZERO;
        String appliedCouponCode = null;
        if (couponCode != null && !couponCode.isBlank()) {
            if (isBulkOrder) {
                throw new BadRequestException("Coupons are not applicable for bulk orders");
            }
            List<com.ascendons.coupon.dto.CartItemDTO> couponCartItems = items.stream().map(item ->
                com.ascendons.coupon.dto.CartItemDTO.builder()
                    .productId(item.variant.getProduct().getId())
                    .variantId(item.variant.getId())
                    .categoryId(item.variant.getProduct().getCategory().getId())
                    .sku(item.variant.getSku())
                    .price(item.variant.getPrice())
                    .quantity(item.quantity)
                    .build()
            ).toList();

            com.ascendons.coupon.dto.CouponValidationResponse couponResponse = couponService.validateCoupon(couponCode, user.getId(), couponCartItems);
            if (couponResponse.isValid()) {
                couponDiscount = couponResponse.getDiscountAmount();
                appliedCouponCode = couponResponse.getCode();
            } else {
                throw new BadRequestException("Coupon validation failed: " + couponResponse.getMessage());
            }
        }
        log.debug("Coupon discount: {}", couponDiscount);
        order.setItems(orderItems);

        // When a coupon is applied, reduce the tax amounts proportionally
        // (GST must be calculated on the discounted price, not the full price)
        if (couponDiscount.compareTo(BigDecimal.ZERO) > 0 && orderSubtotal.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discountRatio = couponDiscount.divide(orderSubtotal, 10, RoundingMode.HALF_UP);
            BigDecimal keepRatio = BigDecimal.ONE.subtract(discountRatio);

            // Reduce each line item's GST first, then derive the order-level totals below as the SUM
            // of these (already-reduced) line items. Previously the order totals were reduced by the
            // same ratio independently of the per-item reduction — two separate roundings of the same
            // ratio that can drift apart, so the invoice's header GST breakdown stopped matching the
            // sum of its own line items' GST amounts. Summing here makes that impossible by construction.
            for (OrderItem oi : orderItems) {
                if (oi.getTaxAmount() != null) oi.setTaxAmount(oi.getTaxAmount().multiply(keepRatio).setScale(2, RoundingMode.HALF_UP));
                if (oi.getCgstAmount() != null) oi.setCgstAmount(oi.getCgstAmount().multiply(keepRatio).setScale(2, RoundingMode.HALF_UP));
                if (oi.getSgstAmount() != null) oi.setSgstAmount(oi.getSgstAmount().multiply(keepRatio).setScale(2, RoundingMode.HALF_UP));
                if (oi.getIgstAmount() != null) oi.setIgstAmount(oi.getIgstAmount().multiply(keepRatio).setScale(2, RoundingMode.HALF_UP));
            }

            taxAmountConverted = orderItems.stream()
                    .map(OrderItem::getTaxAmount).filter(v -> v != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            cgstTotalConverted = orderItems.stream()
                    .map(OrderItem::getCgstAmount).filter(v -> v != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            sgstTotalConverted = orderItems.stream()
                    .map(OrderItem::getSgstAmount).filter(v -> v != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            igstTotalConverted = orderItems.stream()
                    .map(OrderItem::getIgstAmount).filter(v -> v != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (cgstTotalConverted.compareTo(BigDecimal.ZERO) == 0) cgstTotalConverted = null;
            if (sgstTotalConverted.compareTo(BigDecimal.ZERO) == 0) sgstTotalConverted = null;
            if (igstTotalConverted.compareTo(BigDecimal.ZERO) == 0) igstTotalConverted = null;
        }

        BigDecimal netTotalInBase = totalInBase.subtract(couponDiscount);
        if (netTotalInBase.compareTo(BigDecimal.ZERO) < 0) netTotalInBase = BigDecimal.ZERO;

        BigDecimal finalTotalAmount = currencyService.convert(netTotalInBase, baseCurrency.getCode(), targetCurrencyCode);
        BigDecimal couponDiscountConverted = currencyService.convert(couponDiscount, baseCurrency.getCode(), targetCurrencyCode);

        BigDecimal shippingFee = (shippingFeeParam != null && shippingFeeParam.compareTo(BigDecimal.ZERO) > 0)
                ? shippingFeeParam : BigDecimal.ZERO;
        finalTotalAmount = finalTotalAmount.add(shippingFee);
        log.info("Final total amount: {}", finalTotalAmount);
        order.setTotalAmount(finalTotalAmount);
        order.setShippingFee(shippingFee);
        order.setTaxAmount(taxAmountConverted);
        order.setCgstAmount(cgstTotalConverted);
        order.setSgstAmount(sgstTotalConverted);
        order.setIgstAmount(igstTotalConverted);
        order.setCouponCode(appliedCouponCode);
        order.setCouponDiscount(couponDiscountConverted);
        order.setPreferredCourierId(preferredCourierId);
        log.info("Order: {}", order);
        // ── ATOMIC FLUSH: save order → deduct inventory → record movements ──
        // All within the same transaction; any failure rolls back everything
        order = orderRepository.save(order);

        // Deduct inventory (sorted order matches the lock order above — no deadlock)
        for (InventoryDelta delta : inventoryDeltas) {
            Inventory inventory = inventoryRepository.findByIdForUpdate(delta.variantId()).get();
            inventory.setQuantity(inventory.getQuantity() - delta.quantityChange());
            inventoryRepository.save(inventory);
            log.info("Inventory after deduction: {}", inventory.toString());
            movementRepository.save(InventoryMovement.builder()
                    .productVariant(inventory.getProductVariant())
                    .changeQty(-delta.quantityChange())
                    .reason(delta.reason())
                    .build());
            log.info("Inventory movement saved:");
        }
        log.info("Items packed in boxes: {}", sortedItems);
        // Pack items into boxes
        List<PackagingService.PackagingItem> packagingItems = sortedItems.stream()
                .map(item -> new PackagingService.PackagingItem(
                        item.variant.getId(),
                        item.variant.getSku(),
                        item.variant.getProduct().getName(),
                        item.quantity,
                        item.variant.getLengthMm() != null ? item.variant.getLengthMm() : 0,
                        item.variant.getBreadthMm() != null ? item.variant.getBreadthMm() : 0,
                        item.variant.getHeightMm() != null ? item.variant.getHeightMm() : 0,
                        item.variant.getWeightKg() != null ? item.variant.getWeightKg() : 0.0
                ))
                .toList();
        log.info("Packaging items: {}", packagingItems);
        List<OrderBoxAssignment> boxAssignments = packagingService.packItems(order, packagingItems);
        for (OrderBoxAssignment assignment : boxAssignments) {
            boxAssignmentRepository.save(assignment);
        }

        return orderMapper.toResponse(order);
    }

    public OrderTrackingResponse getOrderTracking(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        Shipment shipment = shipmentRepository.findByOrderId(orderId).orElse(null);

        String internalStatus = shipment != null && shipment.getStatus() != null
                ? shipment.getStatus().name()
                : order.getStatus().name();

        return OrderTrackingResponse.builder()
                .awb(shipment != null ? shipment.getTrackingNumber() : null)
                .carrier(shipment != null ? shipment.getCarrier() : null)
                .trackingUrl(shipment != null ? shipment.getTrackingUrl() : null)
                .internalStatus(internalStatus)
                .etd(shipment != null ? (shipment.getEstimatedDelivery() != null ? shipment.getEstimatedDelivery().toString() : null) : null)
                .activities(java.util.List.of())
                .build();
    }

    @Transactional
    public OrderResponse updateTracking(UUID orderId, String carrier, String trackingNumber, String trackingUrl, String estimatedDelivery) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        Shipment shipment = shipmentRepository.findByOrderId(orderId).orElseGet(() ->
                Shipment.builder()
                        .order(order)
                        .status(com.ascendons.order.entity.ShipmentStatus.IN_TRANSIT)
                        .build()
        );

        if (carrier != null) shipment.setCarrier(carrier);
        if (trackingNumber != null) shipment.setTrackingNumber(trackingNumber);
        if (trackingUrl != null) shipment.setTrackingUrl(trackingUrl);
        if (estimatedDelivery != null) {
            shipment.setEstimatedDelivery(OffsetDateTime.parse(estimatedDelivery));
        }
        shipmentRepository.save(shipment);

        // Auto-advance order to SHIPPED when tracking info is added
        if (trackingNumber != null && order.getStatus() != OrderStatus.SHIPPED && order.getStatus() != OrderStatus.DELIVERED) {
            order.setStatus(OrderStatus.SHIPPED);
            orderRepository.save(order);
            triggerStatusEmail(order, OrderStatus.SHIPPED);
        }

        return orderMapper.toResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID userId) {
        // Pessimistic lock prevents concurrent cancellation + webhook both restoring inventory
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus != OrderStatus.PENDING && currentStatus != OrderStatus.CONFIRMED) {
            throw new BadRequestException(
                    "Order cannot be cancelled. Only PENDING or CONFIRMED orders can be cancelled.");
        }
        if (currentStatus == OrderStatus.CANCELLED) {
            return orderMapper.toResponse(order); // already cancelled — idempotent
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        // Restore inventory only if not already restored (webhook + cancelOrder could both fire)
        if (!Boolean.TRUE.equals(savedOrder.getInventoryRestored())) {
            savedOrder.setInventoryRestored(true);
            savedOrder = orderRepository.save(savedOrder);
            final UUID restoredOrderId = savedOrder.getId();
            for (OrderItem item : savedOrder.getItems()) {
                inventoryRepository.findByIdForUpdate(item.getProductVariant().getId()).ifPresent(inv -> {
                    inv.setQuantity(inv.getQuantity() + item.getQuantity());
                    inventoryRepository.save(inv);
                    movementRepository.save(InventoryMovement.builder()
                            .productVariant(item.getProductVariant())
                            .changeQty(item.getQuantity())
                            .reason("Order cancelled by customer: " + restoredOrderId)
                            .build());
                });
            }
        }

        try {
            emailService.sendOrderCancelledEmail(
                    savedOrder.getUser().getEmail(),
                    savedOrder.getUser().getFirstName(),
                    savedOrder.getId().toString(),
                    "Cancelled by customer");
        } catch (Exception e) {
            log.warn("Failed to send cancellation email for order {}: {}", savedOrder.getId(), e.getMessage());
        }

        return orderMapper.toResponse(savedOrder);
    }

    @Transactional
    public OrderResponse requestReturn(UUID orderId, UUID userId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Return can only be requested for delivered orders.");
        }

        if (Boolean.TRUE.equals(order.getReturnRequested())) {
            throw new BadRequestException("A return has already been requested for this order.");
        }

        order.setReturnRequested(true);
        order.setReturnReason(reason);
        order.setReturnRequestedAt(OffsetDateTime.now());
        Order savedOrder = orderRepository.save(order);

        try {
            emailService.sendReturnRequestedEmail(
                    savedOrder.getUser().getEmail(),
                    savedOrder.getUser().getFirstName(),
                    savedOrder.getId().toString(),
                    reason);
        } catch (Exception e) {
            log.warn("Failed to send return request email for order {}: {}", savedOrder.getId(), e.getMessage());
        }

        return orderMapper.toResponse(savedOrder);
    }

    /**
     * One-time backfill for orders placed before the discounted-item-tax fix: their per-item
     * tax/cgst/sgst/igst still hold the pre-discount value even though the order-level GST
     * totals were already scaled down by the coupon. Re-derives the same keepRatio used at
     * order-creation time and applies it to each affected item. Safe to re-run — orders whose
     * item tax already sums to the order-level tax total (already fixed, or never discounted)
     * are left untouched.
     */
    @Transactional
    public Map<String, Object> backfillDiscountedItemTax() {
        List<Order> candidates = orderRepository.findByCouponDiscountGreaterThan(BigDecimal.ZERO);
        int fixed = 0, skipped = 0;

        for (Order order : candidates) {
            BigDecimal orderSubtotal = order.getItems().stream()
                    .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (orderSubtotal.compareTo(BigDecimal.ZERO) <= 0) { skipped++; continue; }

            BigDecimal sumItemTax = order.getItems().stream()
                    .map(i -> i.getTaxAmount() != null ? i.getTaxAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal orderTax = order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO;

            // Already consistent (fixed at creation time by the live code, or a prior backfill run) — skip.
            if (sumItemTax.subtract(orderTax).abs().compareTo(new BigDecimal("0.02")) <= 0) { skipped++; continue; }

            BigDecimal discountRatio = order.getCouponDiscount().divide(orderSubtotal, 10, RoundingMode.HALF_UP);
            BigDecimal keepRatio = BigDecimal.ONE.subtract(discountRatio);

            for (OrderItem oi : order.getItems()) {
                if (oi.getTaxAmount() != null) oi.setTaxAmount(oi.getTaxAmount().multiply(keepRatio).setScale(2, RoundingMode.HALF_UP));
                if (oi.getCgstAmount() != null) oi.setCgstAmount(oi.getCgstAmount().multiply(keepRatio).setScale(2, RoundingMode.HALF_UP));
                if (oi.getSgstAmount() != null) oi.setSgstAmount(oi.getSgstAmount().multiply(keepRatio).setScale(2, RoundingMode.HALF_UP));
                if (oi.getIgstAmount() != null) oi.setIgstAmount(oi.getIgstAmount().multiply(keepRatio).setScale(2, RoundingMode.HALF_UP));
            }
            fixed++;
        }

        log.info("Backfill discounted item tax: scanned={}, fixed={}, skipped={}", candidates.size(), fixed, skipped);
        return Map.of("scanned", candidates.size(), "fixed", fixed, "skipped", skipped);
    }

    @Transactional
    public OrderResponse updateAdminNotes(UUID orderId, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        order.setAdminNotes(notes);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse approveReturn(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!Boolean.TRUE.equals(order.getReturnRequested())) {
            throw new BadRequestException("No return request pending for this order");
        }
        order.setStatus(OrderStatus.CANCELLED);
        if (!Boolean.TRUE.equals(order.getInventoryRestored())) {
            restoreInventoryForOrder(order);
            order.setInventoryRestored(true);
        }
        order.setAdminNotes(
                (order.getAdminNotes() != null ? order.getAdminNotes() + "\n" : "")
                + "Return approved by admin at " + OffsetDateTime.now());
        OrderResponse response = orderMapper.toResponse(orderRepository.save(order));
        try {
            String name = order.getUser().getFirstName()
                    + (order.getUser().getLastName() != null ? " " + order.getUser().getLastName() : "");
            emailService.sendReturnApprovedEmail(order.getUser().getEmail(), name, orderId.toString());
        } catch (Exception e) {
            log.error("Failed to send return approved email for order {}: {}", orderId, e.getMessage());
        }
        return response;
    }

    @Transactional
    public OrderResponse rejectReturn(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!Boolean.TRUE.equals(order.getReturnRequested())) {
            throw new BadRequestException("No return request pending for this order");
        }
        order.setReturnRequested(false);
        order.setAdminNotes(
                (order.getAdminNotes() != null ? order.getAdminNotes() + "\n" : "")
                + "Return rejected by admin at " + OffsetDateTime.now());
        OrderResponse response = orderMapper.toResponse(orderRepository.save(order));
        try {
            String name = order.getUser().getFirstName()
                    + (order.getUser().getLastName() != null ? " " + order.getUser().getLastName() : "");
            emailService.sendReturnRejectedEmail(order.getUser().getEmail(), name, orderId.toString(), null);
        } catch (Exception e) {
            log.error("Failed to send return rejected email for order {}: {}", orderId, e.getMessage());
        }
        return response;
    }

    private void restoreInventoryForOrder(Order order) {
        for (com.ascendons.order.entity.OrderItem item : order.getItems()) {
            UUID variantId = item.getProductVariant().getId();
            inventoryRepository.findByIdForUpdate(variantId).ifPresent(inv -> {
                inv.setQuantity(inv.getQuantity() + item.getQuantity());
                inventoryRepository.save(inv);
                movementRepository.save(com.ascendons.inventory.entity.InventoryMovement.builder()
                        .productVariant(item.getProductVariant())
                        .changeQty(item.getQuantity())
                        .reason("Return approved by admin for order: " + order.getId())
                        .build());
            });
        }
    }

    private record OrderItemData(ProductVariant variant, int quantity) {}

    public List<OrderResponse> getUserOrders(UUID userId, String filter) {
        OffsetDateTime from = switch (filter == null ? "this_year" : filter) {
            case "this_month" -> OffsetDateTime.now()
                    .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            case "all_time"  -> null;
            default          -> OffsetDateTime.now()
                    .withDayOfYear(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        };
        Specification<Order> spec = Specification
                .where(OrderSpecifications.withUserId(userId))
                .and(OrderSpecifications.createdAfter(from));
        return orderRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(orderMapper::toResponse).toList();
    }

    public List<OrderResponse> getAllOrders(OrderStatus status, OffsetDateTime from, String search, UUID userId) {
        Specification<Order> spec = Specification
                .where(OrderSpecifications.withStatus(status))
                .and(OrderSpecifications.createdAfter(from))
                .and(OrderSpecifications.matchSearch(search))
                .and(OrderSpecifications.withUserId(userId));
        return orderRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(orderMapper::toResponse).toList();
    }

    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepository.findByIdWithPaymentsAndShipments(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return orderMapper.toResponse(order);
    }

    public OrderResponse getOrderByIdForUser(UUID orderId, UUID userId) {
        Order order = orderRepository.findByIdWithPaymentsAndShipments(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!order.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Order", "id", orderId);
        }
        return orderMapper.toResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid order status: " + request.getStatus());
        }

        OrderStatus currentStatus = order.getStatus();

        // Idempotent early-exit
        if (newStatus == currentStatus) return orderMapper.toResponse(order);

        // Enforce state machine
        java.util.Set<OrderStatus> allowed = VALID_TRANSITIONS.getOrDefault(currentStatus, java.util.Set.of());
        if (!allowed.contains(newStatus)) {
            throw new BadRequestException(
                "Invalid status transition: " + currentStatus + " → " + newStatus +
                ". Allowed from " + currentStatus + ": " + allowed);
        }

        OrderStatus previousStatus = currentStatus;
        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        // Restore inventory if order is being cancelled (and was not already cancelled/restored)
        boolean wasActive = previousStatus != OrderStatus.CANCELLED;
        if (newStatus == OrderStatus.CANCELLED && wasActive && !Boolean.TRUE.equals(order.getInventoryRestored())) {
            savedOrder.setInventoryRestored(true);
            final Order updatedOrder = orderRepository.save(savedOrder);
            for (OrderItem item : updatedOrder.getItems()) {
                inventoryRepository.findByIdForUpdate(item.getProductVariant().getId()).ifPresent(inv -> {
                    inv.setQuantity(inv.getQuantity() + item.getQuantity());
                    inventoryRepository.save(inv);
                    movementRepository.save(InventoryMovement.builder()
                            .productVariant(item.getProductVariant())
                            .changeQty(item.getQuantity())
                            .reason("Order cancelled by admin: " + updatedOrder.getId())
                            .build());
                });
            }
            savedOrder = updatedOrder;
        }

        triggerStatusEmail(savedOrder, newStatus);

        return orderMapper.toResponse(savedOrder);
    }

    private void triggerStatusEmail(Order order, OrderStatus newStatus) {
        try {
            String email = order.getUser().getEmail();
            String name = order.getUser().getFirstName();
            String orderId = order.getId().toString();
            Shipment shipment = shipmentRepository.findByOrderId(order.getId()).orElse(null);

            switch (newStatus) {
                case SHIPPED -> {
                    String awb = shipment != null ? shipment.getTrackingNumber() : null;
                    String courier = shipment != null ? shipment.getCarrier() : null;
                    emailService.sendOrderShippedEmail(email, name, orderId, awb, courier);
                }
                case DELIVERED -> emailService.sendOrderDeliveredEmail(email, name, orderId);
                case CANCELLED -> emailService.sendOrderCancelledEmail(email, name, orderId, "Cancelled by admin");
                default -> {}
            }
        } catch (Exception e) {
            log.warn("Failed to send status-change email for order {} → {}: {}", order.getId(), newStatus, e.getMessage());
        }
    }
}
