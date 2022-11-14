const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

// get all Tag
router.get('/', async (req, res) => {
  try {
    const tagData = await Tag.findAll();
    res.status(200).json(tagData);
  } catch (err){
    res.status(500).json(err);
  }
  // find all Tag
  // be sure to include its associated Category and Tag data
});

// get one tag
router.get('/:id', async (req, res) => {
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [{model: Category }]
    })

    if(!tagData) {
      res.status(404).json({message: "No tag found for this ID"});
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
  // find a single tag by its `id`
  // be sure to include its associated Category and Tag data
});

// create new tag
router.post('/', async (req, res) => {
  try {
    const tagData = await Tag.create(req.body, {
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(400).json(err);
  }
  /* req.body should look like this...
    {
      tag_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Tag.create(req.body)
    .then((tag) => {
      // if there's tag tags, we need to create pairings to bulk create in the tagTag model
      if (req.body.tagIds.length) {
        const tagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            tag_id: tag.id,
            tag_id,
          };
        });
        return Tag.bulkCreate(tagIdArr);
      }
      // if no tag tags, just respond
      res.status(200).json(tag);
    })
    .then((tagIds) => res.status(200).json(tagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update tag
router.put('/:id', (req, res) => {
  // update tag data
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((tag) => {
      // find all associated tags from tagTag
      return Tag.findAll({ where: { tag_id: req.params.id } });
    })
    .then((Tags) => {
      // get list of current tag_ids
      const TagIds = tags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newtags = req.body.tagIds
        .filter((tag_id) => !tagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            tag_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const tagsToRemove = tags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        Tag.destroy({ where: { id: tagsToRemove } }),
        Tag.bulkCreate(newtags),
      ]);
    })
    .then((updatedTags) => res.json(updatedTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete one tag by its `id` value
  try {
    const tagData = await Tag.destroy({
      where: {
        id: req.params.id
      }
    });

    if (!tagData) {
      res.status(404).json({ message: 'No tag found with this id!' });
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
