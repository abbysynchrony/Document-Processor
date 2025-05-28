const mongoose = require('mongoose');
require('dotenv').config();

async function clearCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const result = await mongoose.connection.collection('documents').deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} documents from 'documents' collection.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error deleting documents:', err.message);
  } finally {
    process.exit();
  }
}

clearCollection();