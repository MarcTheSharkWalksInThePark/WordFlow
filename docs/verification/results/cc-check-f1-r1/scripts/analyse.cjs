// Summarise r1 rows files given on the command line.
const fs=require("fs");const rows=process.argv.slice(2).flatMap(f=>JSON.parse(fs.readFileSync(f)));
const c=(f)=>rows.filter(f).length;
const out={rows:rows.length,direct:c(r=>r.kind==="direct"),natural:c(r=>r.kind==="natural"),
 failing:rows.filter(r=>r.errors.length).map(r=>[r.kind,r.viewport,r.focusMode?"focus":"",r.size,"letter="+r.letter,"ctx="+r.context,r.token,r.errors.join("; ")].join(" ")),
 masterVisible:c(r=>r.masterVisible===true),masterClipped:c(r=>r.masterVisible===false),
 mvFontChanged:c(r=>r.masterVisible&&r.masterFont!==r.branchFont),
 mvPixelFirstIdentical:c(r=>r.pixels&&r.pixels[0].px===0),mvPixelFinalIdentical:c(r=>r.pixels&&r.pixels[r.pixels.length-1].px===0),
 mvPixelRecaptures:rows.filter(r=>r.pixels&&r.pixels[0].px).map(r=>[r.kind,r.viewport,r.size,r.token,JSON.stringify(r.pixels)].join(" ")),
 clippedFitted:c(r=>r.masterVisible===false&&r.masterFont!==r.branchFont),
 scrolling:c(r=>r.scrolling),wrappedNoScroll:c(r=>r.wrapped&&!r.scrolling),
 readingScrollToFinishScroll:c(r=>r.readingScroll&&r.scrolling),
 naturalTwoPlays:c(r=>r.kind==="natural"&&r.plays&&r.plays[1]===2),naturalMasterPlays:[...new Set(rows.filter(r=>r.kind==="natural").map(r=>r.plays&&r.plays[0]))],
 inertProbes:c(r=>r.inert),inertOk:c(r=>r.inert&&r.inert.ok),
 tabReached:c(r=>r.inert&&r.inert.tabReachedWord),focusOk:c(r=>r.inert&&!r.inert.programmaticFocus),wheelMoved:c(r=>r.inert&&r.inert.wheel.moved),progMoved:c(r=>r.inert&&r.inert.programmaticScroll.moved),
 paintOutside:c(r=>r.paint&&r.paint.outside),paintAbove:c(r=>r.paint&&r.paint.aboveAny.length),maxPanelDelta:Math.max(...rows.filter(r=>r.paint).map(r=>r.paint.panelMax)),
 noWordPixels:rows.filter(r=>r.noWordPixels).map(r=>[r.kind,r.viewport,r.size,r.token].join(" ")),
 uncoveredScroll:rows.filter(r=>r.scrolling&&r.paint&&r.paint.uncoveredByPanel).map(r=>[r.kind,r.viewport,r.focusMode?"focus":"",r.size,r.token,r.paint.uncoveredByPanel].join(" ")),
 restartExact:c(r=>r.restart&&r.restart.restart.immediate&&r.restart.restart.settled),
 restartEmptyStyle:c(r=>r.restart&&r.restart.restart.emptyStyleOnly),
 playExact:c(r=>r.restart&&r.restart.play.immediate&&r.restart.play.settled&&r.restart.play.firstWord),
 playEmptyStyle:c(r=>r.restart&&(r.restart.play.emptyStyleOnly||r.restart.play.firstWordEmptyStyleOnly)),
 emptyStyleCasesMasterVisible:c(r=>r.restart&&(r.restart.restart.emptyStyleOnly||r.restart.play.emptyStyleOnly)&&r.masterVisible),
 emptyStyleSides:[...new Set(rows.filter(r=>r.restart&&r.restart.restart.emptyStyleOnly).map(r=>r.restart.restart.emptyStyleSide))],
 restartIndex0:c(r=>r.restart&&r.restart.restart.index===0&&r.restart.play.index===0&&r.restart.play.countdownValue===3),
 scrollYDiffer:c(r=>r.scrollY&&r.scrollY[0]!==r.scrollY[1]),
 scrollGeom:rows.filter(r=>r.scrollGeometry).length};
console.log(JSON.stringify(out,null,1));
