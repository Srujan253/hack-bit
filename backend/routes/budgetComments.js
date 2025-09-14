import express from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import BudgetComment from "../models/BudgetComment.js";
import Budget from "../models/Budget.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Rate limiting for comment submission
const commentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 comments per windowMs
  message: {
    error: "Too many comments submitted. Please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get all approved comments for a budget (Public)
router.get("/budget/:budgetId", async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    // Verify budget exists
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Build filter
    const filter = {
      budgetId,
      isApproved: true,
      isPublic: true,
    };

    if (type && ["comment", "suggestion", "question"].includes(type)) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const comments = await BudgetComment.find(filter)
      .select("-email -moderatedBy -moderationReason") // Hide sensitive fields from public
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("replies.isOfficial", "name");

    const total = await BudgetComment.countDocuments(filter);

    res.json({
      message: "Comments retrieved successfully",
      comments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: comments.length,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error retrieving comments" });
  }
});

// Submit a new comment (Public with rate limiting)
router.post("/budget/:budgetId", commentRateLimit, async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { name, email, comment, type = "comment" } = req.body;

    // Validate required fields
    if (!name || !email || !comment) {
      return res
        .status(400)
        .json({ message: "Name, email, and comment are required" });
    }

    // Verify budget exists
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Create comment
    const newComment = new BudgetComment({
      budgetId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      comment: comment.trim(),
      type,
      isPublic: true,
      isApproved: true, // Auto-approve for demo/testing
    });

    await newComment.save();

    res.status(201).json({
      message:
        "Comment submitted successfully. It will be visible after moderation.",
      comment: {
        _id: newComment._id,
        name: newComment.name,
        comment: newComment.comment,
        type: newComment.type,
        createdAt: newComment.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit comment error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ message: "Server error submitting comment" });
  }
});

// Get all comments for moderation (Admin only)
router.get("/admin/pending", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "pending" } = req.query;

    let filter = {};
    if (status === "pending") {
      filter.isApproved = false;
      filter.moderatedBy = { $exists: false };
    } else if (status === "approved") {
      filter.isApproved = true;
    } else if (status === "rejected") {
      filter.isApproved = false;
      filter.moderatedBy = { $exists: true };
    }

    const skip = (page - 1) * limit;

    const comments = await BudgetComment.find(filter)
      .populate("budgetId", "title category financialYear")
      .populate("moderatedBy", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BudgetComment.countDocuments(filter);

    res.json({
      message: "Comments retrieved successfully",
      comments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: comments.length,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error("Get pending comments error:", error);
    res.status(500).json({ message: "Server error retrieving comments" });
  }
});

// Moderate comment (Admin only)
router.put(
  "/admin/:commentId/moderate",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const { action, reason } = req.body; // action: 'approve' or 'reject'

      if (!action || !["approve", "reject"].includes(action)) {
        return res
          .status(400)
          .json({ message: "Valid action (approve/reject) is required" });
      }

      const comment = await BudgetComment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (action === "approve") {
        comment.approve(req.user._id, reason);
      } else {
        comment.reject(req.user._id, reason);
      }

      await comment.save();

      res.json({
        message: `Comment ${action}d successfully`,
        comment,
      });
    } catch (error) {
      console.error("Moderate comment error:", error);
      res.status(500).json({ message: "Server error moderating comment" });
    }
  }
);

// Add reply to comment (Admin only)
router.post("/:commentId/reply", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const comment = await BudgetComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Add official reply
    comment.addReply(
      "Government Official",
      req.user.email,
      message.trim(),
      true // isOfficial
    );

    await comment.save();

    res.json({
      message: "Reply added successfully",
      comment,
    });
  } catch (error) {
    console.error("Add reply error:", error);
    res.status(500).json({ message: "Server error adding reply" });
  }
});

// Like a comment (Public)
router.post("/:commentId/like", async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await BudgetComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.isApproved) {
      return res
        .status(403)
        .json({ message: "Cannot like unapproved comment" });
    }

    comment.likes += 1;
    await comment.save();

    res.json({
      message: "Comment liked successfully",
      likes: comment.likes,
    });
  } catch (error) {
    console.error("Like comment error:", error);
    res.status(500).json({ message: "Server error liking comment" });
  }
});

// Get comment statistics for a budget (Public)
router.get("/budget/:budgetId/stats", async (req, res) => {
  try {
    const { budgetId } = req.params;

    const stats = await BudgetComment.aggregate([
      {
        $match: {
          budgetId: new mongoose.Types.ObjectId(budgetId),
          isApproved: true,
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalLikes: { $sum: "$likes" },
        },
      },
    ]);

    const totalComments = await BudgetComment.countDocuments({
      budgetId,
      isApproved: true,
    });

    res.json({
      message: "Comment statistics retrieved successfully",
      totalComments,
      byType: stats,
      engagement: {
        totalLikes: stats.reduce((sum, stat) => sum + stat.totalLikes, 0),
        avgLikesPerComment:
          totalComments > 0
            ? stats.reduce((sum, stat) => sum + stat.totalLikes, 0) /
              totalComments
            : 0,
      },
    });
  } catch (error) {
    console.error("Get comment stats error:", error);
    res.status(500).json({ message: "Server error retrieving statistics" });
  }
});

export default router;
