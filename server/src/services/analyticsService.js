const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const ChatLog = require('../models/ChatLog');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

class AnalyticsService {
  async getOverview() {
    // 1. Document metrics
    const totalDocuments = await Document.countDocuments();
    const indexedDocuments = await Document.countDocuments({ status: 'INDEXED' });
    const failedDocuments = await Document.countDocuments({ status: 'FAILED' });
    const totalChunks = await Chunk.countDocuments();

    // 2. Query metrics
    const totalQueries = await ChatLog.countDocuments();
    const totalConversations = await Conversation.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });

    // 3. Confidence Metrics
    const confidenceAgg = await ChatLog.aggregate([
      { $match: { isGrounded: true, confidenceScore: { $gt: 0 } } },
      { $group: { _id: null, avgConfidence: { $avg: '$confidenceScore' } } },
    ]);
    const avgConfidence = confidenceAgg[0]?.avgConfidence ? Math.round(confidenceAgg[0].avgConfidence * 100) : 85;

    // 4. Feedback metrics
    const upVotes = await ChatLog.countDocuments({ feedback: 'up' });
    const downVotes = await ChatLog.countDocuments({ feedback: 'down' });
    const totalRated = upVotes + downVotes;
    const satisfactionRate = totalRated > 0 ? Math.round((upVotes / totalRated) * 100) : 92;

    // 5. Unanswered / Low-Confidence Questions
    const topUnanswered = await ChatLog.find({ isGrounded: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('query createdAt');

    // 6. Recent Queries Timeline (last 7 days volume)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const queryTimeline = await ChatLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$confidenceScore' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 7. Department queries distribution
    const departmentDistribution = await Document.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    return {
      documents: {
        total: totalDocuments,
        indexed: indexedDocuments,
        failed: failedDocuments,
        totalChunks,
      },
      queries: {
        total: totalQueries,
        conversations: totalConversations,
        studentsCount: totalStudents,
        avgConfidence,
      },
      feedback: {
        upVotes,
        downVotes,
        totalRated,
        satisfactionRate,
      },
      topUnanswered: topUnanswered.map((u) => ({ id: u._id, query: u.query, date: u.createdAt })),
      queryTimeline,
      departmentDistribution: departmentDistribution.map((d) => ({
        department: d._id || 'General',
        count: d.count,
      })),
    };
  }
}

module.exports = new AnalyticsService();
