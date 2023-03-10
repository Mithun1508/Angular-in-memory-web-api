var gulp = require("gulp");
var $ = require("gulp-load-plugins")({ lazy: true });
var args = require("yargs").argv;
var cp = require("child_process");
var del = require("del");
var path = require("path");
var tsOutput = "./in-memory-web-api/";
var jsCopySrc = ["*.js", "*.js.map", "*.d.ts"].map((ext) => tsOutput + ext);
gulp.task("default", ["help"]);
gulp.task("help", $.taskListing.withFilters(function(taskName) {
  var isSubTask = taskName.substr(0, 1) == "_";
  return isSubTask;
}, function(taskName) {
  var shouldRemove = taskName === "default";
  return shouldRemove;
}));
gulp.task("build", ["tsc"], function() {
  return gulp.src(jsCopySrc).pipe(gulp.dest("./"));
});
gulp.task("tsc", ["clean"], function(done) {
  runTSC("./", done);
});
gulp.task("clean", function(done) {
  clean([tsOutput + "*.*", "*.js", "*.js.map", "*.d.ts", "!gulpfile.js"], done);
});
gulp.task("bump", function() {
  var msg = "Bumping versions";
  var type = args.type;
  var version = args.ver;
  var options = {};
  if (version) {
    options.version = version;
    msg += " to " + version;
  } else {
    options.type = type;
    msg += " for a " + type;
  }
  log(msg);
  return gulp.src("package.json").pipe($.bump(options)).pipe(gulp.dest("./"));
});
function clean(path2, done) {
  log("Cleaning: " + $.util.colors.blue(path2));
  del(path2, { dryRun: false }).then(function(paths) {
    console.log("Deleted files and folders:\n", paths.join("\n"));
  }).then(done, done);
}
function log(msg) {
  if (typeof msg === "object") {
    for (var item in msg) {
      if (msg.hasOwnProperty(item)) {
        $.util.log($.util.colors.blue(msg[item]));
      }
    }
  } else {
    $.util.log($.util.colors.blue(msg));
  }
}
function runTSC(directory, done) {
  directory = directory || "./";
  var tscjs = path.join(process.cwd(), "node_modules/typescript/bin/tsc");
  var childProcess = cp.spawn("node", [tscjs, "-p", directory], { cwd: process.cwd() });
  childProcess.stdout.on("data", function(data) {
    console.log(data.toString());
  });
  childProcess.stderr.on("data", function(data) {
    console.log(data.toString());
  });
  childProcess.on("close", function() {
    done();
  });
}
function runTypings(done) {
  var typingsjs = path.join(process.cwd(), "node_modules/typings/dist/bin/typings");
  var childProcess = cp.spawn("node", [typingsjs, "install"], { cwd: process.cwd() });
  childProcess.stdout.on("data", function(data) {
    console.log(data.toString());
  });
  childProcess.stderr.on("data", function(data) {
    console.log(data.toString());
  });
  childProcess.on("close", function() {
    done();
  });
}
//# sourceMappingURL=gulpfile.js.map
