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

    // 4. Remove any legacy auto-seeded demo products if present (do not auto-seed demo products)
    const demoSlugs = [
      'everyday-denim',
      'the-classic-shirt',
      'relaxed-tee',
      'weekend-knit',
      'cold-day-coat',
    ];
    await Product.deleteMany({ slug: { $in: demoSlugs } });
  } catch (error) {
    console.error('Seed check error:', error.message);
  }
};

module.exports = { ensureSeedData };
