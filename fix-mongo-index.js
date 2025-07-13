const { MongoClient } = require('mongodb');

async function dropGoalIdIndex() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hamhibokka';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('goals');

    // goalId 인덱스 삭제
    try {
      await collection.dropIndex('goalId_1');
      console.log('✅ goalId_1 인덱스가 성공적으로 삭제되었습니다.');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️  goalId_1 인덱스가 이미 존재하지 않습니다.');
      } else {
        console.error('❌ 인덱스 삭제 중 오류:', error.message);
      }
    }

    // 현재 인덱스 목록 확인
    const indexes = await collection.indexes();
    console.log('📋 현재 인덱스 목록:');
    indexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
  } catch (error) {
    console.error('❌ MongoDB 연결 오류:', error.message);
  } finally {
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

dropGoalIdIndex();
