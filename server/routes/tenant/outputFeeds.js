const express      = require('express');
const { ObjectId } = require('mongodb');
const auth         = require('../../middleware/auth');
const tenantResolver = require('../../middleware/tenantResolver');
const FeedFormat   = require('../../models/FeedFormat');
const { generateFeedFile } = require('../../services/feedGeneratorService');
const { getTenantId, generateFeedId, now } = require('../../utils/feedHelpers');

const router = express.Router();

router.get('/', auth, tenantResolver, async (req, res) => {
  try {
    const feeds = await req.tenantDb
      .collection('output_feeds')
      .find({ archived: 0 })
      .sort({ createdon: -1 })
      .toArray();
    res.json({ success: true, data: feeds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/formats', auth, async (req, res) => {
  try {
    const formats = await FeedFormat
      .find({ status: 'active', archived: 0 })
      .sort({ feed_id: 1 });
    res.json({ success: true, data: formats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', auth, tenantResolver, async (req, res) => {
  console.log('✅ POST /api/output-feeds hit');
  console.log('📦 Body:', req.body);
  console.log('🏪 TenantId:', req.headers['x-tenant-id']);
  try {
    const cmpid  = getTenantId(req);
    const feedid = generateFeedId();
    const userId = req.user?._id || req.user?.id || '';

    const fmt = await FeedFormat.findOne({
      feed_id: Number(req.body.output_format_id)
    });

    console.log('📋 Format found:', fmt);

    if (!fmt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format selected'
      });
    }

    const filename = `${cmpid}_${fmt.feed_folder}_${fmt.feed_format}_output.${fmt.feed_format}`;
    const fileurl  = `../uploads/output_feeds/${fmt.feed_folder}/${cmpid}/${feedid}/${filename}`;

    const feedDoc = {
      cmpid,
      feedid,
      cron_server_id:          1,
      output_format_id:        fmt.feed_id,
      output_feed_name:        req.body.output_feed_name        || fmt.feed_name,
      output_feed_separator:   fmt.feed_separator               || '',
      output_feed_tracking:    '',
      output_title_text:       '',
      output_link_text:        '',
      output_desc_text:        '',
      product_scope:           '',
      op_freq:                 '',
      op_text_qualifier:       req.body.op_text_qualifier        || 'none',
      op_price_decimal:        '',
      is_header:               req.body.is_header                ?? '1',
      is_modified_data:        0,
      output_delivery_method:  'http',
      format_subtype:          'default',
      format_subtype_currency: req.body.format_subtype_currency  || 'INR',
      products_total:          0,
      status:                  'active',
      archived:                0,
      excl_stats:              { cat: 0, total: 0, df: 0, fq: 0, prod: 0 },
      is_output_setup:         0,
      is_upload_zip:           0,
      output_filename:         filename,
      output_fileurl:          fileurl,
      output_public_url:       '',
      createdby:               userId,
      modifiedby:              userId,
      createdon:               now(),
      modifiedon:              now(),
    };

    const result = await req.tenantDb
      .collection('output_feeds')
      .insertOne(feedDoc);

    const savedFeed = await req.tenantDb
      .collection('output_feeds')
      .findOne({ _id: result.insertedId });

    console.log('✅ Feed saved successfully');

    res.status(201).json({ success: true, data: savedFeed });

  } catch (err) {
    console.log('❌ Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, tenantResolver, async (req, res) => {
  try {
    const fmt = await FeedFormat.findOne({
      feed_id: Number(req.body.output_format_id)
    });

    const updateData = {
      ...req.body,
      modifiedon: now(),
      modifiedby: req.user?._id || req.user?.id || '',
    };

    if (fmt) {
      const feed = await req.tenantDb
        .collection('output_feeds')
        .findOne({ _id: new ObjectId(req.params.id) });

      if (feed) {
        updateData.output_filename   = `${feed.cmpid}_${fmt.feed_folder}_${fmt.feed_format}_output.${fmt.feed_format}`;
        updateData.output_fileurl    = `../uploads/output_feeds/${fmt.feed_folder}/${feed.cmpid}/${feed.feedid}/${updateData.output_filename}`;
        updateData.is_output_setup   = 0;
        updateData.output_public_url = '';
      }
    }

    await req.tenantDb
      .collection('output_feeds')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData }
      );

    const updated = await req.tenantDb
      .collection('output_feeds')
      .findOne({ _id: new ObjectId(req.params.id) });

    res.json({ success: true, data: updated });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, tenantResolver, async (req, res) => {
  try {
    await req.tenantDb
      .collection('output_feeds')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { archived: 1, modifiedon: now() } }
      );
    res.json({ success: true, message: 'Feed deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/build', auth, tenantResolver, async (req, res) => {
  try {
    const feed = await req.tenantDb
      .collection('output_feeds')
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!feed) {
      return res.status(404).json({ success: false, message: 'Feed not found' });
    }

    await req.tenantDb
      .collection('output_feeds')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: 'building' } }
      );

    const result = await generateFeedFile({
      tenantDb: req.tenantDb,
      feed
    });

    const baseUrl   = `${req.protocol}://${req.get('host')}`;
    const publicUrl = `${baseUrl}${result.publicUrl}`;

    await req.tenantDb
      .collection('output_feeds')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: {
            is_output_setup:   1,
            status:            'active',
            output_fileurl:    result.fileurl,
            output_filename:   result.filename,
            output_public_url: publicUrl,
            products_total:    result.productCount,
            modifiedon:        now(),
        }}
      );

    const updatedFeed = await req.tenantDb
      .collection('output_feeds')
      .findOne({ _id: new ObjectId(req.params.id) });

    res.json({
      success:   true,
      data:      updatedFeed,
      publicUrl: publicUrl,
    });

  } catch (err) {
    await req.tenantDb
      .collection('output_feeds')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: 'failed', modifiedon: now() } }
      );
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
