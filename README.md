# Angular-in-memory-web-api

![Screenshot (64)](https://user-images.githubusercontent.com/93249038/214481538-d528f94a-eec7-4d9b-bacc-e7c98dd0c6bc.png)


# Use case
1) Demo apps that need to simulate CRUD data persistence operations without a real server. You won't have to build and start a test server.

2) Whip up prototypes and proofs of concept.

3) Share examples with the community in a web coding environment such as Plunker or CodePen. Create Angular issues and StackOverflow answers supported by live code.

4) Simulate operations against data collections that aren't yet implemented on your dev/test server. You can pass requests thru to the dev/test server for collections that are supported.

5) Write unit test apps that read and write data. Avoid the hassle of intercepting multiple http calls and manufacturing sequences of responses. The in-memory data store resets for each test so there is no cross-test data pollution.

6) End-to-end tests. If you can toggle the app into test mode using the in-memory web api, you won't disturb the real database. This can be especially useful for CI (continuous integration) builds.

# HTTP request handling
This in-memory web api service processes an HTTP request and returns an Observable of HTTP Response object in the manner of a RESTy web api. It natively handles URI patterns in the form :base/:collectionName/:id?

Examples:

  // for requests to an `api` base URL that gets heroes from a 'heroes' collection 
  GET api/heroes          // all heroes
  
  GET api/heroes/42       // the hero with id=42
  
  GET api/heroes?name=^j  // 'j' is a regex; returns heroes whose name starting with 'j' or 'J'
  
  GET api/heroes.json/42  // ignores the ".json"
The in-memory web api service processes these requests against a "database" - a set of named collections - that you define during setup.

# Setup
Basic setup

Create an InMemoryDataService class that implements InMemoryDbService.

At minimum it must implement createDb which creates a "database" hash whose keys are collection names and whose values are arrays of collection objects to return or update. For example:

import { InMemoryDbService } from 'angular-in-memory-web-api';

export class InMemHeroService implements InMemoryDbService {
  createDb() {
  
    let heroes = [
      { id: 1, name: 'Quicksilver' },
      
      
      { id: 2, name: 'flash' },
      
      { id: 3, name: 'Thor' },
      
      { id: 4, name: 'thanos' }
    ];
    return {heroes};
  }
}

# HTTP method interceptors
You may have HTTP requests that the in-memory web api can't handle properly.

You can override any HTTP method by implementing a method of that name in your InMemoryDbService.

Your method's name must be the same as the HTTP method name but all lowercase. The in-memory web api calls it with a RequestInfo object that contains request data and utility methods.

For example, if you implemented a get method, the web api would be called like this: yourInMemDbService["get"](requestInfo).

Your custom HTTP method must return either:

Observable<Response> - you handled the request and the response is available from this observable. It should be "cold".

null/undefined - you decided not to intervene, perhaps because you wish to intercept only certain paths for the given HTTP method. The service continues with its default processing of the HTTP request.

The RequestInfo is an interface defined in src/in-mem/interfaces.ts. Its members include:

req: Request;           // the request object from the client

collectionName: string; // calculated from the request url  

collection: any[];      // the corresponding collection (if found)   

id: any;                // the item `id` (if specified)   

url: string;            // the url in the request 

utils: RequestInfoUtilities; // helper functions 

The functions in utils can help you analyze the request and compose a response.

# In-memory Web Api Examples
The github repository demonstrates library usage with tested examples.

The HeroInMemDataService class (in src/app/hero-in-mem-data.service.ts) is a Hero-oriented InMemoryDbService such as you might see in an HTTP sample in the Angular documentation.

The HeroInMemDataOverrideService class (in src/app/hero-in-mem-data-override.service.ts) demonstrates a few ways to override methods of the base HeroInMemDataService.

# build  
Build Instructions

1) gulp bump - up the package version number.

2) update CHANGELOG.md to record the change. Call out breaking changes.

3) update README.md if usage or interfaces change.

4) consider updating the dependency versions in package.json.

5) npm install the new package(s) if you did.

6)npm list --depth=0 to make sure they really did install!

7) gulp clean to delete all generated files.

8) npm test to dev-build and run tests (see "Testing" below).

9)gulp build to build for distribution.

10) git add, commit, and push.

11) npm publish

# Testing
Note that The "app" for this repo is not a real app. It's an Angular data service (HeroService) and a bunch of tests.

Note that the tsconfig.json produces a commonjs module. That's what Angular specs require. But when building for an app, 
it should be a es2015 module, as is the tsconfig-ngc.json for AOT-ready version of this library.

These tests are a work-in-progress, as tests often are.

The src/ folder is divided into

app/ - the test "app" and its tests

in-mem/ - the source code for the in-memory web api library
