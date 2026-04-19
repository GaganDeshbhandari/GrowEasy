## Plan: Frontend Bug Fix (Stock to Available Stock)

Fix real-time stock validations by displaying the newly available `available_stock` field from the backend instead of the overall `stock` property.

**Steps**
1. Update `frontend/src/pages/products/ProductList.jsx`:
   - Change `product.stock` to `product.available_stock` in the badge styling logic (`parseFloat(product.available_stock) > 0`).
   - Pass `product.available_stock` instead of `product.stock` to the `getStockText` helper to format properly as "{available_stock} kg left", etc.
   - *Note: There is no "Add to Cart" button natively on this page's cards, so no button disabling is needed here. The product card itself will naturally show the "Out of Stock" badge securely.*

2. Update `frontend/src/pages/products/ProductDetail.jsx`:
   - Update `maxQty` calculation to strictly rely on `parseFloat(product.available_stock ?? 0)`.
   - Update the "Availability" badge text rendering from `{product.stock}` to `{product.available_stock}`, and enforce "Out of Stock" (capitalized).
   - Change the `user?.role === "customer"` conditional block to always render the Add to Cart module even if `maxQty <= 0`.
   - Conditionally disable the quantity decrement/increment buttons and `<input>` element when `maxQty === 0`.
   - Update the "Add to Cart" button to disable when `maxQty === 0` and display "Out of Stock" text when unavailable.
   - Insert the requested "This product is currently out of stock" static message beneath the input fields when `maxQty === 0`.

**Verification**
Run the local dev server and ensure zero console errors. Validate zero CSS layout shifting occurs for both mobile and desktop constraints.

**Decisions**
- Kept the UI styling identical per instructions, purely focusing on replacing the variable interpolations and state boundaries. 
