const User = require('./models/User');
const Collection = require('./models/Collection');
const Product = require('./models/Product');
const Settings = require('./models/Settings');

const ensureSeedData = async () => {
  try {
    // 1. Ensure Admin User
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin && adminEmail && adminPassword) {
      const admin = await User.create({
        name: 'Store Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`Admin user seeded: ${admin.email}`);
    } else if (!existingAdmin) {
      console.warn('Admin seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD are required.');
    }

    // 2. Ensure Site Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        siteName: 'Bunon Gents',
        topAnnouncement: "THE MEN'S COLLECTION IS HERE  ·  DISCOVER YOUR NEXT EVERYDAY FAVORITE",
        heroSubtitle: 'A NEW WAY TO WEAR EVERYDAY',
        heroTitleLine1: 'Wear what',
        heroTitleLine2: 'feels like you.',
        heroDescription:
          "Thoughtful pieces for the moments that make up your life. Discover the men's collection—easy to wear, made to stand out.",
        heroImage:
          'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1800&auto=format&fit=crop',
        winterBannerSubtitle: 'THE WINTER COLLECTION',
        winterBannerTitle1: 'Cold weather.',
        winterBannerTitle2: 'Good style.',
        winterBannerDesc: 'Layers that bring warmth and character to every day of the season.',
        winterBannerImage:
          'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1600&auto=format&fit=crop',
        bkashNumber: '01700-000000 (Personal)',
        bkashActive: true,
        nagadNumber: '01800-000000 (Personal)',
        nagadActive: true,
        codActive: true,
        insideDhakaShipping: 70,
        outsideDhakaShipping: 130,
        contactEmail: adminEmail,
        contactPhone: '+880 1700-000000',
        categories: ['Jeans', 'Shirts', 'T-shirts', 'Sweaters', 'Winter collection'],
      });
      console.log('✅ Default site & payment settings seeded.');
    } else {
      await Settings.updateMany({ siteName: 'BUNON Geants' }, { $set: { siteName: 'Bunon Gents' } });
    }

    // 3. Ensure Collections (Men, Women, Kids as in Canva reference)
    const collectionCount = await Collection.countDocuments();
    if (collectionCount === 0) {
      await Collection.insertMany([
        {
          numberLabel: '01 / AVAILABLE NOW',
          title: 'Men',
          slug: 'men',
          subtitle: 'EXPLORE THE COLLECTION →',
          status: 'AVAILABLE NOW',
          image:
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
          order: 1,
        },
        {
          numberLabel: '02 / IN THE MAKING',
          title: 'Women',
          slug: 'women',
          subtitle: 'SOMETHING BEAUTIFUL IS ON ITS WAY',
          status: 'COMING SOON',
          image: '',
          order: 2,
        },
        {
          numberLabel: '03 / IN THE MAKING',
          title: 'Kids',
          slug: 'kids',
          subtitle: 'LITTLE LOOKS, COMING SOON',
          status: 'COMING SOON',
          image: '',
          order: 3,
        },
      ]);
      console.log('✅ Default collections (Men, Women, Kids) seeded.');
    }

    // 4. Ensure Products (Exact 5 products from Canva reference with BDT prices)
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany([
        {
          title: 'Everyday Denim',
          slug: 'everyday-denim',
          category: 'Jeans',
          badge: 'EVERYDAY ESSENTIAL',
          price: 2250,
          originalPrice: 2650,
          description:
            'Crafted from durable mid-weight selvedge-inspired denim with subtle stretch for all-day movement. Tailored for a clean, modern tapered silhouette that pairs effortlessly with boots or sneakers.',
          fabricAndCare: '98% Organic Cotton, 2% Elastane. Wash cold inside out.',
          image:
            'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop',
          gallery: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop',
          ],
          sizes: ['30', '32', '34', '36', '38'],
          colors: ['Indigo Wash', 'Vintage Blue', 'Jet Black'],
          stock: 35,
          featured: true,
          inStock: true,
        },
        {
          title: 'The Classic Shirt',
          slug: 'the-classic-shirt',
          category: 'Shirts',
          badge: 'EASY POLISH',
          price: 1850,
          originalPrice: 2100,
          description:
            'Our signature crisp oxford weave shirt designed to take you from morning meetings to evening dinners without missing a beat. Structured collar, breathable weave, and timeless tailoring.',
          fabricAndCare: '100% Combed Egyptian Cotton. Machine wash gentle.',
          image:
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
          gallery: [
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
          ],
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: ['Crisp White', 'Forest Olive', 'Sky Oxford'],
          stock: 42,
          featured: true,
          inStock: true,
        },
        {
          title: 'Relaxed Tee',
          slug: 'relaxed-tee',
          category: 'T-shirts',
          badge: 'WEAR ON REPEAT',
          price: 1150,
          originalPrice: 1390,
          description:
            'Heavyweight 240 GSM jersey t-shirt with a relaxed drop-shoulder cut and ribbed crew neck that never loses its shape. Pre-washed for an ultra-soft lived-in feel from day one.',
          fabricAndCare: '100% Ring-Spun Organic Cotton (240 GSM).',
          image:
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
          gallery: [
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
          ],
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: ['Deep Forest', 'Charcoal Black', 'Warm Sand'],
          stock: 60,
          featured: true,
          inStock: true,
        },
        {
          title: 'Weekend Knit',
          slug: 'weekend-knit',
          category: 'Sweaters',
          badge: 'LAYER UP',
          price: 2450,
          originalPrice: 2800,
          description:
            'Textured stripe crew-neck knit crafted for cool evenings and effortless layering. Soft against the skin with refined ribbed cuffs and hem.',
          fabricAndCare: '85% Fine Cotton, 15% Merino Wool blend.',
          image:
            'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?q=80&w=1000&auto=format&fit=crop',
          gallery: [
            'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?q=80&w=1000&auto=format&fit=crop',
          ],
          sizes: ['M', 'L', 'XL', 'XXL'],
          colors: ['Espresso Stripe', 'Oatmeal Melange'],
          stock: 22,
          featured: true,
          inStock: true,
        },
        {
          title: 'Cold Day Coat',
          slug: 'cold-day-coat',
          category: 'Winter collection',
          badge: 'WINTER COLLECTION',
          price: 4200,
          originalPrice: 4950,
          description:
            'Statement tailored herringbone overcoat engineered for warmth and unmistakable presence. Features a structured lapel, deep welt pockets, and smooth quilted interior lining.',
          fabricAndCare: 'Wool-blend herringbone outer, 100% Satin Viscose lining. Dry clean only.',
          image:
            'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
          gallery: [
            'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
          ],
          sizes: ['M', 'L', 'XL'],
          colors: ['Herringbone Charcoal', 'Camel Brown'],
          stock: 15,
          featured: true,
          inStock: true,
        },
      ]);
      console.log('✅ Default 5 reference products seeded.');
    }
  } catch (error) {
    console.error('Seed check error:', error.message);
  }
};

module.exports = { ensureSeedData };
