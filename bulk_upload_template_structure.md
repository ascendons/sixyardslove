# Products Bulk Upload Template Structure

To use the bulk upload feature in the Admin Panel, your Excel or CSV file should follow the column structure below.

> [!TIP]
> Each row represents a **Product Variant (SKU)**. If multiple rows have the same **Product (Code)**, they will be grouped as variants under a single product.

## Required Columns

| Column Header | Description | Example / Format |
| :--- | :--- | :--- |
| **Product** | Unique code for the product. | `GHEE-001` |
| **Product / Unit** | Display name of the product. | `Pure Desi Cow Ghee` |
| **Category** | Major category. | `Food & Staples` |
| **Sub Category** | Minor category. | `Ghee & Vanaspati` |
| **Unit** | Base unit of measurement. | `1 Litre` |
| **Location** | Source/Storage location. | `Warehouse-A` |
| **Monthly Production Capacity** | Max units produced per month. | `5000` |
| **Produced By (Unit Type)** | Type of production unit. | `Artisanal` |
| **Return Applicable** | Whether returns are allowed. | `Yes` or `No` |
| **Return Window** | Number of days for return. | `7` |
| **Tax%** | Tax percentage as a decimal. | `0.05` (representing 5%) |
| **Lead time for production** | Time required before shipping. | `2 days` |
| **Product description** | Detailed product information. | `Rich, aromatic ghee...` |
| **Competitive advantage** | Why this product is better. | `Direct from farm` |
| **SKU Code** | Unique identifier for the specific variant. | `GHEE-001-P1` |
| **Packaging Available** | Type of packaging for this variant. | `Glass Jar` |
| **Box Length (mm)** | Outer box length in millimetres. | `269` |
| **Box Breadth (mm)** | Outer box breadth in millimetres. | `70` |
| **Box Height (mm)** | Outer box height in millimetres. | `121` |
| **Units per Box** | How many units fit in one box (for shipping calc). | `12` |
| **Pricing - MRP with tax** | Maximum Retail Price. | `750` |
| **Selling price** | Standard retail selling price. | `699` |
| **Bulk order price** | Price applied for wholesale/bulk orders. | `600` |
| **MOQ** | Minimum Order Quantity for this variant. | `10` |
| **Cost of goods sold COGS** | Internal cost per unit. | `450` |

> [!IMPORTANT]
| **System Robustness**: The system now automatically trims leading and trailing spaces from your headers, so ` SKU Code` and `SKU Code` are both accepted.
| **Tax%**: Ensure the value is provided as a decimal (e.g., `0.05` for 5%, `0.18` for 18%).
| **Return Policy**: Use exactly `Yes` to enable returns for a product.
