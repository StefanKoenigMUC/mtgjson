/*jslint node: true */
"use strict";

var base = require("xbase");
var C = require('../shared/C');
var fs = require("fs");
var path = require("path");
var shared = require("shared");
var tiptoe = require("tiptoe");

var setsToDo = shared.getSetsToDo();

setsToDo.removeAll(C.SETS_NOT_ON_GATHERER.concat(shared.getMCISetCodes()));

base.info("Doing sets: %s", setsToDo);

setsToDo.serialForEach(function(arg, subcb) {
	var targetSet = C.SETS.mutateOnce(function(SET) { if(SET.name.toLowerCase()===arg.toLowerCase() || SET.code.toLowerCase()===arg.toLowerCase()) { return SET; } });
	if(!targetSet)
	{
		base.error("Set %s not found!", arg);
		return setImmediate(subcb);
	}

	if(targetSet.isMCISet)
	{
		base.error("Set %s is an MCI set, use importMCISet.js instead.", arg);
		return setImmediate(subcb);
	}


	tiptoe(
		function loadJSON() {
			base.info("Loading file for set %s (%s)", targetSet.name, targetSet.code);
			fs.readFile(path.join(__dirname, "..", "json", targetSet.code + ".json"), "utf8", this);
		},
		function convertAndSave(JSONRaw) {
			var set = JSON.parse(JSONRaw);
			shared.saveSet(set, this);
		},
		function finish(err) {
			setImmediate(function() { subcb(err); });
		}
	);

	base.info("Done with %s.", targetSet.name);
},
function exit(err) {
	if(err) {
		base.error(err);
		process.exit(1);
	}

	process.exit(0);
});
