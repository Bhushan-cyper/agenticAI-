const Collection = require('../models/Collection');

class CollectionController {
  async getAll(req, res, next) {
    try {
      const collections = await Collection.find().populate('documentIds', 'title status pageCount chunkCount department').sort({ name: 1 });
      res.status(200).json({
        success: true,
        count: collections.length,
        collections,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, department, description, icon } = req.body;
      const collection = await Collection.create({
        name,
        department,
        description,
        icon: icon || 'BookOpen',
      });
      res.status(201).json({
        success: true,
        message: 'Collection created successfully',
        collection,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { name, department, description, icon, documentIds } = req.body;
      const collection = await Collection.findByIdAndUpdate(
        req.params.id,
        { name, department, description, icon, documentIds },
        { new: true }
      ).populate('documentIds', 'title status pageCount chunkCount department');

      if (!collection) {
        return res.status(404).json({ success: false, message: 'Collection not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Collection updated successfully',
        collection,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const collection = await Collection.findByIdAndDelete(req.params.id);
      if (!collection) {
        return res.status(404).json({ success: false, message: 'Collection not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Collection deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CollectionController();
