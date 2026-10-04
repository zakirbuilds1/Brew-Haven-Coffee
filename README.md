# Brew Haven Coffee Co.

Static coffee shop website. Plain HTML, CSS and JavaScript, no build step.

```
index.html      page markup
css/style.css   styles and design tokens
js/main.js      cart + checkout, product carousel, glass card tilt, menu tabs, FAQ, newsletter, mobile menu
images/         WebP photography in two sizes each (see CREDITS.md)
vercel.json     browser caching rules for images, CSS and JS on Vercel
```

## Before going live

- Check the contact details, opening hours, menu items and prices in `index.html`.
- Menu prices also live in `js/main.js` (the `CATALOG` list at the top of the cart code, in US cents: `450` = $4.50). Keep both in sync. Free delivery starts at $25 and the delivery fee is $3.99 (`FREE_DELIVERY_AT` and `DELIVERY_FEE`).
- The phone number (212) 555-0148 is a placeholder from the range reserved for fictional use. Replace it and the address with the real ones.
- The cart, checkout, and newsletter forms only work in the browser for now: orders are not sent anywhere and no payment is taken. Connect checkout to your ordering or payment system (for example Stripe, Square or Toast) and the newsletter to your email tool before launch.
- Add Terms and Privacy pages if you take online orders.

## Images

Every photo comes in two widths, and the page lets each device download only the size it needs. Each image also has a tiny blurred preview written into `index.html`, so photos fade in instead of popping in. If you swap in your own photos, keep the same file names and sizes, or update the `src`, `srcset` and `--lqip` values.

## Deploy

Upload the contents of this folder to a GitHub repository, then import that repository on vercel.com/new (Framework Preset: Other, no build command).
