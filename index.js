#!/usr/bin/env node
"use strict";

var argv = require('minimist')(process.argv.slice(2));
var parallelize = require('parallelize');
var webshot = require('webshot');
var opn = require('opn');
var tmpDir = require('os').tmpDir();
var resemble = require('node-resemble-js');
var fs = require('fs');

resemble.outputSettings({
  // green
  errorColor: {
    red: 0,
    green: 255,
    blue: 0
  },
  errorType: 'movement'
});

['siteA', 'siteB'].forEach(function(opt) {
  if (!argv[opt]) { throw new Error(opt + ' argument missing'); }
});

var siteA = tmpDir + '/siteA.png';
var siteB = tmpDir + '/siteB.png';
var out = tmpDir + '/vis-diff.png';
var renderDelay = (argv.renderDelay) ? parseInt(argv.renderDelay, 10) : 0;
var misMatchPercentage = (argv.mismatch) ? parseInt(argv.mismatch) : -1;

var next = parallelize(function(err) {
  if (err) { throw err; }

  resemble(siteA).compareTo(siteB)
    .ignoreAntialiasing()
    .ignoreColors()
    .onComplete(function(data){
      if ((misMatchPercentage > 0) && (data.misMatchPercentage >= misMatchPercentage)) {
        console.error('Error: missmatch percentage %s', data.misMatchPercentage);
        process.exit(1);
      }

      data.getDiffImage().pack().pipe(fs.createWriteStream(out)).on('close', function() {
        opn(out);
      });
    });
});

var webshotOpts = {
  renderDelay: renderDelay,
  shotSize: {
    width: 'all',
    height: 'all'
  }
};

webshot(argv.siteA, siteA, webshotOpts, next());
webshot(argv.siteB, siteB, webshotOpts, next());
