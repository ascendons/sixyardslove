package com.ascendons.analytics;

import com.ascendons.catalog.repository.ProductRepository;
import com.ascendons.order.entity.OrderStatus;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.user.entity.Role;
import com.ascendons.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/admin/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @GetMapping
    public Map<String, Object> getDashboardAnalytics() {
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long totalCustomers = userRepository.findByRole(Role.USER, PageRequest.of(0, 1)).getTotalElements();
        BigDecimal totalRevenue = orderRepository.sumRevenueExcludingCancelled();

        // Monthly sales for the last 6 months — one aggregate query per month
        List<Map<String, Object>> monthlySales = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(now.minusMonths(i));
            OffsetDateTime start = ym.atDay(1).atStartOfDay().atOffset(now.getOffset());
            OffsetDateTime end = ym.atEndOfMonth().atTime(23, 59, 59).atOffset(now.getOffset());
            BigDecimal monthRevenue = orderRepository.sumRevenueBetween(start, end);
            monthlySales.add(Map.of(
                    "name", ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    "sales", monthRevenue
            ));
        }

        // Orders by status — one count query per status
        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            ordersByStatus.put(status.name(), orderRepository.countByStatus(status));
        }

        return Map.of(
                "totalOrders", totalOrders,
                "totalRevenue", totalRevenue,
                "totalProducts", totalProducts,
                "totalCustomers", totalCustomers,
                "monthlySales", monthlySales,
                "ordersByStatus", ordersByStatus
        );
    }
}
