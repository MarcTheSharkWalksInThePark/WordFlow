"use strict";
// Absence probe: every child Node process also refuses browser automation imports.
const Module=require("node:module"),fs=require("node:fs");
const load=Module._load,exists=fs.existsSync;
Module._load=function(name,...args) {
 if(/playwright|browser-helper/.test(name))throw new Error("Browser automation deliberately unavailable");
 return load.call(this,name,...args);
};
fs.existsSync=function(file) {return /chrome(?:\.exe)?$/i.test(String(file))?false:exists.call(this,file);};
