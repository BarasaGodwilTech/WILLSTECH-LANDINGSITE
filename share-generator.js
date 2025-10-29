// Share Page Generator for Will's Tech Store
class SharePageGenerator {
    constructor(baseUrl = 'https://BarasaGodwilTech.github.io/willstech-tempolary') {
        this.baseUrl = baseUrl;
    }

    // Generate a URL-friendly slug from product name
    generateSlug(productName) {
        return productName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    // Generate share page HTML for a single product
    generateSharePage(product) {
        const slug = this.generateSlug(product.name);
        // Use first image from images array, fallback to old image property
        const imageUrl = product.images?.[0] || product.image;
        
        return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${product.name} — Will's Tech Store</title>
    <meta property="og:title" content="${product.name} — Will's Tech Store">
    <meta property="og:description" content="${product.description} — available at Will's Tech Store.">
    <meta property="og:type" content="product">
    <meta property="og:url" content="${this.baseUrl}/share/${slug}.html">
    <meta property="og:image" content="${this.baseUrl}/${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="1200">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${product.name} — Will's Tech Store">
    <meta name="twitter:description" content="${product.description} — available at Will's Tech Store.">
    <meta name="twitter:image" content="${this.baseUrl}/${imageUrl}">
    <meta property="product:price:amount" content="${product.price}">
    <meta property="product:price:currency" content="UGX">
</head>
<body>
    <p>If you are not redirected automatically, <a href="/index.html#products">click here to view the product</a>.</p>
    <script>
        setTimeout(function(){ window.location.href = '/index.html#products'; }, 1200);
    </script>
</body>
</html>`;
    }

    // Update product cards in index.html to include share buttons
    updateProductCard(productHtml, product) {
        const slug = this.generateSlug(product.name);
        const shareUrl = `${this.baseUrl}/share/${slug}.html`;
        
        // Add share button to product actions
        return productHtml.replace(
            /<div class="product-actions">/,
            `<div class="product-actions">
                <button class="share-btn" data-share-url="${shareUrl}" aria-label="Share product">
                    <i class="fas fa-share-alt"></i>
                </button>`
        );
    }

    // Generate all share pages for an array of products
    generateAllSharePages(products) {
        const sharePages = {};
        
        products.forEach(product => {
            const slug = this.generateSlug(product.name);
            sharePages[`share/${slug}.html`] = this.generateSharePage(product);
        });
        
        return sharePages;
    }
}

// If using in admin.js, integrate like this:
/*
class WillTechAdmin {
    constructor() {
        // ... existing constructor ...
        this.shareGenerator = new SharePageGenerator();
    }

    async saveProduct(productData) {
        // ... existing save logic ...
        
        // Generate share page
        const sharePage = this.shareGenerator.generateSharePage(productData);
        const slug = this.shareGenerator.generateSlug(productData.name);
        
        // Save share page to GitHub
        await this.createFileInRepo(
            `share/${slug}.html`,
            sharePage,
            `Update share page for ${productData.name}`
        );
    }
}
*/

// Export for use in admin panel
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharePageGenerator;
} else if (typeof window !== 'undefined') {
    window.SharePageGenerator = SharePageGenerator;
}