const Notification = require('../models/Notification');
const { emitNotification } = require('../config/socket');

class FallbackAgent {
  /**
   * Generates a polite, grounded fallback message when confidence is low or no chunks match
   */
  async handleUnknown(query, user = null, conversationId = null) {
    const answer = `I'm sorry, but I don't have verified information regarding **"${query}"** in the uploaded college documents.\n\n### Suggestions:\n- Verify that the terms match campus terminology (e.g., "hostel curfew", "semester fee deadline", "placement eligibility").\n- Try selecting a specific department filter in the chat header.\n- Check with the **Dean of Student Affairs** or relevant departmental office.\n\n*Note: Our college administrators have been notified to review this topic for future handbook updates.*`;

    // Create low confidence notification for admins
    try {
      const notification = await Notification.create({
        type: 'LOW_CONFIDENCE_QUERY',
        title: 'Unanswered Student Question',
        message: `A student asked: "${query}" but no matching documents were found.`,
        metadata: {
          query,
          userId: user?._id || user?.id,
          conversationId,
        },
      });
      emitNotification(notification);
    } catch (err) {
      console.warn('Failed to log admin notification for fallback query:', err.message);
    }

    return {
      answer,
      isGrounded: false,
      confidenceScore: 0.0,
      sources: [],
      provider: 'fallback-agent',
    };
  }
}

module.exports = new FallbackAgent();
