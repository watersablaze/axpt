/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/signup/route";
exports.ids = ["app/api/signup/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@prisma/client");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "(rsc)/../node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsignup%2Froute&page=%2Fapi%2Fsignup%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsignup%2Froute.ts&appDir=%2FUsers%2Fjamalward%2Faxis.point%2Ffrontend%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fjamalward%2Faxis.point%2Ffrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsignup%2Froute&page=%2Fapi%2Fsignup%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsignup%2Froute.ts&appDir=%2FUsers%2Fjamalward%2Faxis.point%2Ffrontend%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fjamalward%2Faxis.point%2Ffrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/../node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/../node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/../node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_jamalward_axis_point_frontend_app_api_signup_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/signup/route.ts */ \"(rsc)/./app/api/signup/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/signup/route\",\n        pathname: \"/api/signup\",\n        filename: \"route\",\n        bundlePath: \"app/api/signup/route\"\n    },\n    resolvedPagePath: \"/Users/jamalward/axis.point/frontend/app/api/signup/route.ts\",\n    nextConfigOutput,\n    userland: _Users_jamalward_axis_point_frontend_app_api_signup_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vbm9kZV9tb2R1bGVzL25leHQvZGlzdC9idWlsZC93ZWJwYWNrL2xvYWRlcnMvbmV4dC1hcHAtbG9hZGVyL2luZGV4LmpzP25hbWU9YXBwJTJGYXBpJTJGc2lnbnVwJTJGcm91dGUmcGFnZT0lMkZhcGklMkZzaWdudXAlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZzaWdudXAlMkZyb3V0ZS50cyZhcHBEaXI9JTJGVXNlcnMlMkZqYW1hbHdhcmQlMkZheGlzLnBvaW50JTJGZnJvbnRlbmQlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGamFtYWx3YXJkJTJGYXhpcy5wb2ludCUyRmZyb250ZW5kJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNZO0FBQ3pGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvamFtYWx3YXJkL2F4aXMucG9pbnQvZnJvbnRlbmQvYXBwL2FwaS9zaWdudXAvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3NpZ251cC9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3NpZ251cFwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvc2lnbnVwL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL2phbWFsd2FyZC9heGlzLnBvaW50L2Zyb250ZW5kL2FwcC9hcGkvc2lnbnVwL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/../node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsignup%2Froute&page=%2Fapi%2Fsignup%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsignup%2Froute.ts&appDir=%2FUsers%2Fjamalward%2Faxis.point%2Ffrontend%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fjamalward%2Faxis.point%2Ffrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/../node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!*******************************************************************************************************!*\
  !*** ../node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \*******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/../node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!*******************************************************************************************************!*\
  !*** ../node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \*******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./app/api/signup/route.ts":
/*!*********************************!*\
  !*** ./app/api/signup/route.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../lib/prisma */ \"(rsc)/./app/lib/prisma.ts\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/server */ \"(rsc)/../node_modules/next/dist/api/server.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/../node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ethers */ \"(rsc)/../node_modules/@ethersproject/wallet/lib.esm/index.js\");\n/* harmony import */ var _utils_crypto_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/crypto-utils */ \"(rsc)/./app/utils/crypto-utils.ts\");\n\n\n\n\n\nasync function POST(request) {\n    try {\n        const { name, email, password, industry, interests } = await request.json();\n        if (!name || !email || !password || !industry || !interests) {\n            return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json({\n                success: false,\n                message: \"All fields are required.\"\n            }, {\n                status: 400\n            });\n        }\n        // Check if user already exists\n        const existingUser = await _lib_prisma__WEBPACK_IMPORTED_MODULE_0__.prisma.user.findUnique({\n            where: {\n                email\n            }\n        });\n        if (existingUser) {\n            return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json({\n                success: false,\n                message: \"User already exists.\"\n            }, {\n                status: 400\n            });\n        }\n        // Hash password\n        const hashedPassword = await bcryptjs__WEBPACK_IMPORTED_MODULE_2___default().hash(password, 10);\n        // Create custodial wallet (generated & controlled by platform)\n        const wallet = ethers__WEBPACK_IMPORTED_MODULE_4__.Wallet.createRandom();\n        const { encryptedData, iv } = (0,_utils_crypto_utils__WEBPACK_IMPORTED_MODULE_3__.encryptPrivateKey)(wallet.privateKey);\n        // Store user with custodial wallet\n        const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_0__.prisma.user.create({\n            data: {\n                name,\n                email,\n                password: hashedPassword,\n                industry,\n                interests,\n                walletAddress: wallet.address,\n                encryptedPrivateKey: encryptedData,\n                iv\n            }\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json({\n            success: true,\n            message: \"Signup successful!\",\n            user: {\n                email: user.email,\n                walletAddress: user.walletAddress\n            }\n        });\n    } catch (error) {\n        console.error(\"Signup error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json({\n            success: false,\n            message: \"Signup failed due to a server error.\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3NpZ251cC9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQTBDO0FBQ0M7QUFDYjtBQUNFO0FBQzZCO0FBRXRELGVBQWVLLEtBQUtDLE9BQWdCO0lBQ3pDLElBQUk7UUFDRixNQUFNLEVBQUVDLElBQUksRUFBRUMsS0FBSyxFQUFFQyxRQUFRLEVBQUVDLFFBQVEsRUFBRUMsU0FBUyxFQUFFLEdBQUcsTUFBTUwsUUFBUU0sSUFBSTtRQUV6RSxJQUFJLENBQUNMLFFBQVEsQ0FBQ0MsU0FBUyxDQUFDQyxZQUFZLENBQUNDLFlBQVksQ0FBQ0MsV0FBVztZQUMzRCxPQUFPVixxREFBWUEsQ0FBQ1csSUFBSSxDQUN0QjtnQkFBRUMsU0FBUztnQkFBT0MsU0FBUztZQUEyQixHQUN0RDtnQkFBRUMsUUFBUTtZQUFJO1FBRWxCO1FBRUEsK0JBQStCO1FBQy9CLE1BQU1DLGVBQWUsTUFBTWhCLCtDQUFNQSxDQUFDaUIsSUFBSSxDQUFDQyxVQUFVLENBQUM7WUFBRUMsT0FBTztnQkFBRVg7WUFBTTtRQUFFO1FBQ3JFLElBQUlRLGNBQWM7WUFDaEIsT0FBT2YscURBQVlBLENBQUNXLElBQUksQ0FDdEI7Z0JBQUVDLFNBQVM7Z0JBQU9DLFNBQVM7WUFBdUIsR0FDbEQ7Z0JBQUVDLFFBQVE7WUFBSTtRQUVsQjtRQUVBLGdCQUFnQjtRQUNoQixNQUFNSyxpQkFBaUIsTUFBTWxCLG9EQUFXLENBQUNPLFVBQVU7UUFFbkQsK0RBQStEO1FBQy9ELE1BQU1hLFNBQVNuQiwwQ0FBTUEsQ0FBQ29CLFlBQVk7UUFDbEMsTUFBTSxFQUFFQyxhQUFhLEVBQUVDLEVBQUUsRUFBRSxHQUFHckIsc0VBQWlCQSxDQUFDa0IsT0FBT0ksVUFBVTtRQUVqRSxtQ0FBbUM7UUFDbkMsTUFBTVQsT0FBTyxNQUFNakIsK0NBQU1BLENBQUNpQixJQUFJLENBQUNVLE1BQU0sQ0FBQztZQUNwQ0MsTUFBTTtnQkFDSnJCO2dCQUNBQztnQkFDQUMsVUFBVVc7Z0JBQ1ZWO2dCQUNBQztnQkFDQWtCLGVBQWVQLE9BQU9RLE9BQU87Z0JBQzdCQyxxQkFBcUJQO2dCQUNyQkM7WUFDRjtRQUNGO1FBRUEsT0FBT3hCLHFEQUFZQSxDQUFDVyxJQUFJLENBQUM7WUFDdkJDLFNBQVM7WUFDVEMsU0FBUztZQUNURyxNQUFNO2dCQUFFVCxPQUFPUyxLQUFLVCxLQUFLO2dCQUFFcUIsZUFBZVosS0FBS1ksYUFBYTtZQUFDO1FBQy9EO0lBQ0YsRUFBRSxPQUFPRyxPQUFZO1FBQ25CQyxRQUFRRCxLQUFLLENBQUMsaUJBQWlCQTtRQUMvQixPQUFPL0IscURBQVlBLENBQUNXLElBQUksQ0FDdEI7WUFBRUMsU0FBUztZQUFPQyxTQUFTO1FBQXVDLEdBQ2xFO1lBQUVDLFFBQVE7UUFBSTtJQUVsQjtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMvamFtYWx3YXJkL2F4aXMucG9pbnQvZnJvbnRlbmQvYXBwL2FwaS9zaWdudXAvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIi4uLy4uL2xpYi9wcmlzbWFcIjtcbmltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IGJjcnlwdCBmcm9tIFwiYmNyeXB0anNcIjtcbmltcG9ydCB7IFdhbGxldCB9IGZyb20gXCJldGhlcnNcIjtcbmltcG9ydCB7IGVuY3J5cHRQcml2YXRlS2V5IH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NyeXB0by11dGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBuYW1lLCBlbWFpbCwgcGFzc3dvcmQsIGluZHVzdHJ5LCBpbnRlcmVzdHMgfSA9IGF3YWl0IHJlcXVlc3QuanNvbigpO1xuXG4gICAgaWYgKCFuYW1lIHx8ICFlbWFpbCB8fCAhcGFzc3dvcmQgfHwgIWluZHVzdHJ5IHx8ICFpbnRlcmVzdHMpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgICAgeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJBbGwgZmllbGRzIGFyZSByZXF1aXJlZC5cIiB9LFxuICAgICAgICB7IHN0YXR1czogNDAwIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBhbHJlYWR5IGV4aXN0c1xuICAgIGNvbnN0IGV4aXN0aW5nVXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBlbWFpbCB9IH0pO1xuICAgIGlmIChleGlzdGluZ1VzZXIpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgICAgeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJVc2VyIGFscmVhZHkgZXhpc3RzLlwiIH0sXG4gICAgICAgIHsgc3RhdHVzOiA0MDAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBIYXNoIHBhc3N3b3JkXG4gICAgY29uc3QgaGFzaGVkUGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuaGFzaChwYXNzd29yZCwgMTApO1xuXG4gICAgLy8gQ3JlYXRlIGN1c3RvZGlhbCB3YWxsZXQgKGdlbmVyYXRlZCAmIGNvbnRyb2xsZWQgYnkgcGxhdGZvcm0pXG4gICAgY29uc3Qgd2FsbGV0ID0gV2FsbGV0LmNyZWF0ZVJhbmRvbSgpO1xuICAgIGNvbnN0IHsgZW5jcnlwdGVkRGF0YSwgaXYgfSA9IGVuY3J5cHRQcml2YXRlS2V5KHdhbGxldC5wcml2YXRlS2V5KTtcblxuICAgIC8vIFN0b3JlIHVzZXIgd2l0aCBjdXN0b2RpYWwgd2FsbGV0XG4gICAgY29uc3QgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGVtYWlsLFxuICAgICAgICBwYXNzd29yZDogaGFzaGVkUGFzc3dvcmQsXG4gICAgICAgIGluZHVzdHJ5LFxuICAgICAgICBpbnRlcmVzdHMsXG4gICAgICAgIHdhbGxldEFkZHJlc3M6IHdhbGxldC5hZGRyZXNzLFxuICAgICAgICBlbmNyeXB0ZWRQcml2YXRlS2V5OiBlbmNyeXB0ZWREYXRhLFxuICAgICAgICBpdixcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiU2lnbnVwIHN1Y2Nlc3NmdWwhXCIsXG4gICAgICB1c2VyOiB7IGVtYWlsOiB1c2VyLmVtYWlsLCB3YWxsZXRBZGRyZXNzOiB1c2VyLndhbGxldEFkZHJlc3MgfSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJTaWdudXAgZXJyb3I6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXG4gICAgICB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIlNpZ251cCBmYWlsZWQgZHVlIHRvIGEgc2VydmVyIGVycm9yLlwiIH0sXG4gICAgICB7IHN0YXR1czogNTAwIH1cbiAgICApO1xuICB9XG59Il0sIm5hbWVzIjpbInByaXNtYSIsIk5leHRSZXNwb25zZSIsImJjcnlwdCIsIldhbGxldCIsImVuY3J5cHRQcml2YXRlS2V5IiwiUE9TVCIsInJlcXVlc3QiLCJuYW1lIiwiZW1haWwiLCJwYXNzd29yZCIsImluZHVzdHJ5IiwiaW50ZXJlc3RzIiwianNvbiIsInN1Y2Nlc3MiLCJtZXNzYWdlIiwic3RhdHVzIiwiZXhpc3RpbmdVc2VyIiwidXNlciIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsImhhc2hlZFBhc3N3b3JkIiwiaGFzaCIsIndhbGxldCIsImNyZWF0ZVJhbmRvbSIsImVuY3J5cHRlZERhdGEiLCJpdiIsInByaXZhdGVLZXkiLCJjcmVhdGUiLCJkYXRhIiwid2FsbGV0QWRkcmVzcyIsImFkZHJlc3MiLCJlbmNyeXB0ZWRQcml2YXRlS2V5IiwiZXJyb3IiLCJjb25zb2xlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/signup/route.ts\n");

/***/ }),

/***/ "(rsc)/./app/lib/prisma.ts":
/*!***************************!*\
  !*** ./app/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prismaClient),\n/* harmony export */   retryQuery: () => (/* binding */ retryQuery)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\n// Enable detailed Prisma logs in development for debugging\nconst prisma = new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log:  true ? [\n        'query',\n        'info',\n        'warn',\n        'error'\n    ] : 0\n});\n// Retry logic for handling transient database errors (optional)\nasync function retryQuery(query, retries = 3) {\n    for(let i = 0; i < retries; i++){\n        try {\n            return await query();\n        } catch (error) {\n            console.error(`Prisma query failed on attempt ${i + 1}:`, error);\n            if (i === retries - 1) throw error; // Throw error if retries are exhausted\n        }\n    }\n    throw new Error('Query retries failed.');\n}\nconst prismaClient = global.prismaInstance || prisma;\nif (true) global.prismaInstance = prismaClient;\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQThDO0FBRTlDLDJEQUEyRDtBQUMzRCxNQUFNQyxTQUFTLElBQUlELHdEQUFZQSxDQUFDO0lBQzlCRSxLQUFLQyxLQUFzQyxHQUFHO1FBQUM7UUFBUztRQUFRO1FBQVE7S0FBUSxHQUFHLENBQVM7QUFDOUY7QUFFQSxnRUFBZ0U7QUFDaEUsZUFBZUMsV0FBY0MsS0FBdUIsRUFBRUMsVUFBVSxDQUFDO0lBQy9ELElBQUssSUFBSUMsSUFBSSxHQUFHQSxJQUFJRCxTQUFTQyxJQUFLO1FBQ2hDLElBQUk7WUFDRixPQUFPLE1BQU1GO1FBQ2YsRUFBRSxPQUFPRyxPQUFPO1lBQ2RDLFFBQVFELEtBQUssQ0FBQyxDQUFDLCtCQUErQixFQUFFRCxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUVDO1lBQzFELElBQUlELE1BQU1ELFVBQVUsR0FBRyxNQUFNRSxPQUFPLHVDQUF1QztRQUM3RTtJQUNGO0lBQ0EsTUFBTSxJQUFJRSxNQUFNO0FBQ2xCO0FBUUEsTUFBTUMsZUFBZUMsT0FBT0MsY0FBYyxJQUFJWjtBQUM5QyxJQUFJRSxJQUFzQyxFQUFFUyxPQUFPQyxjQUFjLEdBQUdGO0FBRXRCIiwic291cmNlcyI6WyIvVXNlcnMvamFtYWx3YXJkL2F4aXMucG9pbnQvZnJvbnRlbmQvYXBwL2xpYi9wcmlzbWEudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuXG4vLyBFbmFibGUgZGV0YWlsZWQgUHJpc21hIGxvZ3MgaW4gZGV2ZWxvcG1lbnQgZm9yIGRlYnVnZ2luZ1xuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCh7XG4gIGxvZzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgPyBbJ3F1ZXJ5JywgJ2luZm8nLCAnd2FybicsICdlcnJvciddIDogWydlcnJvciddLFxufSk7XG5cbi8vIFJldHJ5IGxvZ2ljIGZvciBoYW5kbGluZyB0cmFuc2llbnQgZGF0YWJhc2UgZXJyb3JzIChvcHRpb25hbClcbmFzeW5jIGZ1bmN0aW9uIHJldHJ5UXVlcnk8VD4ocXVlcnk6ICgpID0+IFByb21pc2U8VD4sIHJldHJpZXMgPSAzKTogUHJvbWlzZTxUPiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcmV0cmllczsgaSsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBxdWVyeSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBQcmlzbWEgcXVlcnkgZmFpbGVkIG9uIGF0dGVtcHQgJHtpICsgMX06YCwgZXJyb3IpO1xuICAgICAgaWYgKGkgPT09IHJldHJpZXMgLSAxKSB0aHJvdyBlcnJvcjsgLy8gVGhyb3cgZXJyb3IgaWYgcmV0cmllcyBhcmUgZXhoYXVzdGVkXG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcignUXVlcnkgcmV0cmllcyBmYWlsZWQuJyk7XG59XG5cbi8vIFByZXZlbnQgbXVsdGlwbGUgUHJpc21hIENsaWVudCBpbnN0YW5jZXMgaW4gZGV2ZWxvcG1lbnRcbmRlY2xhcmUgZ2xvYmFsIHtcbiAgLy8gRW5zdXJlIHRoZSBnbG9iYWwgdmFyaWFibGUgcGVyc2lzdHMgYWNyb3NzIGhvdCByZWxvYWRzIGluIGRldmVsb3BtZW50XG4gIHZhciBwcmlzbWFJbnN0YW5jZTogUHJpc21hQ2xpZW50IHwgdW5kZWZpbmVkO1xufVxuXG5jb25zdCBwcmlzbWFDbGllbnQgPSBnbG9iYWwucHJpc21hSW5zdGFuY2UgfHwgcHJpc21hO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnKSBnbG9iYWwucHJpc21hSW5zdGFuY2UgPSBwcmlzbWFDbGllbnQ7XG5cbmV4cG9ydCB7IHByaXNtYUNsaWVudCBhcyBwcmlzbWEsIHJldHJ5UXVlcnkgfTsiXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwicHJpc21hIiwibG9nIiwicHJvY2VzcyIsInJldHJ5UXVlcnkiLCJxdWVyeSIsInJldHJpZXMiLCJpIiwiZXJyb3IiLCJjb25zb2xlIiwiRXJyb3IiLCJwcmlzbWFDbGllbnQiLCJnbG9iYWwiLCJwcmlzbWFJbnN0YW5jZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/lib/prisma.ts\n");

/***/ }),

/***/ "(rsc)/./app/utils/crypto-utils.ts":
/*!***********************************!*\
  !*** ./app/utils/crypto-utils.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   decryptPrivateKey: () => (/* binding */ decryptPrivateKey),\n/* harmony export */   encryptPrivateKey: () => (/* binding */ encryptPrivateKey)\n/* harmony export */ });\n/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! crypto */ \"crypto\");\n/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(crypto__WEBPACK_IMPORTED_MODULE_0__);\n\n// Load USER_SECRET_KEY from the environment\nconst ENCRYPTION_KEY_HEX = process.env.USER_SECRET_KEY;\nif (!ENCRYPTION_KEY_HEX) {\n    throw new Error('USER_SECRET_KEY is not defined in the environment variables. Ensure it is a 64-character hexadecimal string.');\n}\n// Convert the hex key into a Buffer\nconst ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');\n// Validate the length of the encryption key\nif (ENCRYPTION_KEY.length !== 32) {\n    throw new Error('Invalid USER_SECRET_KEY: Ensure it is a 64-character hexadecimal string (32 bytes in length).');\n}\nconst IV_LENGTH = 16; // AES block size for initialization vector (IV)\n/**\n * Encrypts a private key using AES-256-CBC.\n * @param {string} privateKey - The private key to encrypt.\n * @returns {{ encryptedData: string; iv: string }} - An object containing the encrypted data and IV.\n */ function encryptPrivateKey(privateKey) {\n    const iv = crypto__WEBPACK_IMPORTED_MODULE_0___default().randomBytes(IV_LENGTH); // Generate a random IV\n    const cipher = crypto__WEBPACK_IMPORTED_MODULE_0___default().createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);\n    let encrypted = cipher.update(privateKey, 'utf-8', 'hex');\n    encrypted += cipher.final('hex');\n    return {\n        encryptedData: encrypted,\n        iv: iv.toString('hex')\n    };\n}\n/**\n * Decrypts an encrypted private key using AES-256-CBC.\n * @param {string} encryptedData - The encrypted private key.\n * @param {string} iv - The initialization vector (IV) used during encryption.\n * @returns {string} - The decrypted private key.\n */ function decryptPrivateKey(encryptedData, iv) {\n    const decipher = crypto__WEBPACK_IMPORTED_MODULE_0___default().createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv, 'hex') // Convert IV back to a Buffer\n    );\n    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');\n    decrypted += decipher.final('utf-8');\n    return decrypted;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvdXRpbHMvY3J5cHRvLXV0aWxzLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBNEI7QUFFNUIsNENBQTRDO0FBQzVDLE1BQU1DLHFCQUFxQkMsUUFBUUMsR0FBRyxDQUFDQyxlQUFlO0FBRXRELElBQUksQ0FBQ0gsb0JBQW9CO0lBQ3ZCLE1BQU0sSUFBSUksTUFDUjtBQUVKO0FBRUEsb0NBQW9DO0FBQ3BDLE1BQU1DLGlCQUFpQkMsT0FBT0MsSUFBSSxDQUFDUCxvQkFBb0I7QUFFdkQsNENBQTRDO0FBQzVDLElBQUlLLGVBQWVHLE1BQU0sS0FBSyxJQUFJO0lBQ2hDLE1BQU0sSUFBSUosTUFDUjtBQUVKO0FBRUEsTUFBTUssWUFBWSxJQUFJLGdEQUFnRDtBQUV0RTs7OztDQUlDLEdBQ00sU0FBU0Msa0JBQ2RDLFVBQWtCO0lBRWxCLE1BQU1DLEtBQUtiLHlEQUFrQixDQUFDVSxZQUFZLHVCQUF1QjtJQUNqRSxNQUFNSyxTQUFTZiw0REFBcUIsQ0FBQyxlQUFlTSxnQkFBZ0JPO0lBRXBFLElBQUlJLFlBQVlGLE9BQU9HLE1BQU0sQ0FBQ04sWUFBWSxTQUFTO0lBQ25ESyxhQUFhRixPQUFPSSxLQUFLLENBQUM7SUFFMUIsT0FBTztRQUNMQyxlQUFlSDtRQUNmSixJQUFJQSxHQUFHUSxRQUFRLENBQUM7SUFDbEI7QUFDRjtBQUVBOzs7OztDQUtDLEdBQ00sU0FBU0Msa0JBQ2RGLGFBQXFCLEVBQ3JCUCxFQUFVO0lBRVYsTUFBTVUsV0FBV3ZCLDhEQUF1QixDQUN0QyxlQUNBTSxnQkFDQUMsT0FBT0MsSUFBSSxDQUFDSyxJQUFJLE9BQU8sOEJBQThCOztJQUd2RCxJQUFJWSxZQUFZRixTQUFTTCxNQUFNLENBQUNFLGVBQWUsT0FBTztJQUN0REssYUFBYUYsU0FBU0osS0FBSyxDQUFDO0lBRTVCLE9BQU9NO0FBQ1QiLCJzb3VyY2VzIjpbIi9Vc2Vycy9qYW1hbHdhcmQvYXhpcy5wb2ludC9mcm9udGVuZC9hcHAvdXRpbHMvY3J5cHRvLXV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcblxuLy8gTG9hZCBVU0VSX1NFQ1JFVF9LRVkgZnJvbSB0aGUgZW52aXJvbm1lbnRcbmNvbnN0IEVOQ1JZUFRJT05fS0VZX0hFWCA9IHByb2Nlc3MuZW52LlVTRVJfU0VDUkVUX0tFWTtcblxuaWYgKCFFTkNSWVBUSU9OX0tFWV9IRVgpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICdVU0VSX1NFQ1JFVF9LRVkgaXMgbm90IGRlZmluZWQgaW4gdGhlIGVudmlyb25tZW50IHZhcmlhYmxlcy4gRW5zdXJlIGl0IGlzIGEgNjQtY2hhcmFjdGVyIGhleGFkZWNpbWFsIHN0cmluZy4nXG4gICk7XG59XG5cbi8vIENvbnZlcnQgdGhlIGhleCBrZXkgaW50byBhIEJ1ZmZlclxuY29uc3QgRU5DUllQVElPTl9LRVkgPSBCdWZmZXIuZnJvbShFTkNSWVBUSU9OX0tFWV9IRVgsICdoZXgnKTtcblxuLy8gVmFsaWRhdGUgdGhlIGxlbmd0aCBvZiB0aGUgZW5jcnlwdGlvbiBrZXlcbmlmIChFTkNSWVBUSU9OX0tFWS5sZW5ndGggIT09IDMyKSB7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICAnSW52YWxpZCBVU0VSX1NFQ1JFVF9LRVk6IEVuc3VyZSBpdCBpcyBhIDY0LWNoYXJhY3RlciBoZXhhZGVjaW1hbCBzdHJpbmcgKDMyIGJ5dGVzIGluIGxlbmd0aCkuJ1xuICApO1xufVxuXG5jb25zdCBJVl9MRU5HVEggPSAxNjsgLy8gQUVTIGJsb2NrIHNpemUgZm9yIGluaXRpYWxpemF0aW9uIHZlY3RvciAoSVYpXG5cbi8qKlxuICogRW5jcnlwdHMgYSBwcml2YXRlIGtleSB1c2luZyBBRVMtMjU2LUNCQy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlS2V5IC0gVGhlIHByaXZhdGUga2V5IHRvIGVuY3J5cHQuXG4gKiBAcmV0dXJucyB7eyBlbmNyeXB0ZWREYXRhOiBzdHJpbmc7IGl2OiBzdHJpbmcgfX0gLSBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgZW5jcnlwdGVkIGRhdGEgYW5kIElWLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jcnlwdFByaXZhdGVLZXkoXG4gIHByaXZhdGVLZXk6IHN0cmluZ1xuKTogeyBlbmNyeXB0ZWREYXRhOiBzdHJpbmc7IGl2OiBzdHJpbmcgfSB7XG4gIGNvbnN0IGl2ID0gY3J5cHRvLnJhbmRvbUJ5dGVzKElWX0xFTkdUSCk7IC8vIEdlbmVyYXRlIGEgcmFuZG9tIElWXG4gIGNvbnN0IGNpcGhlciA9IGNyeXB0by5jcmVhdGVDaXBoZXJpdignYWVzLTI1Ni1jYmMnLCBFTkNSWVBUSU9OX0tFWSwgaXYpO1xuXG4gIGxldCBlbmNyeXB0ZWQgPSBjaXBoZXIudXBkYXRlKHByaXZhdGVLZXksICd1dGYtOCcsICdoZXgnKTtcbiAgZW5jcnlwdGVkICs9IGNpcGhlci5maW5hbCgnaGV4Jyk7XG5cbiAgcmV0dXJuIHtcbiAgICBlbmNyeXB0ZWREYXRhOiBlbmNyeXB0ZWQsXG4gICAgaXY6IGl2LnRvU3RyaW5nKCdoZXgnKSwgLy8gUmV0dXJuIElWIGFzIGEgaGV4IHN0cmluZ1xuICB9O1xufVxuXG4vKipcbiAqIERlY3J5cHRzIGFuIGVuY3J5cHRlZCBwcml2YXRlIGtleSB1c2luZyBBRVMtMjU2LUNCQy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBlbmNyeXB0ZWREYXRhIC0gVGhlIGVuY3J5cHRlZCBwcml2YXRlIGtleS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpdiAtIFRoZSBpbml0aWFsaXphdGlvbiB2ZWN0b3IgKElWKSB1c2VkIGR1cmluZyBlbmNyeXB0aW9uLlxuICogQHJldHVybnMge3N0cmluZ30gLSBUaGUgZGVjcnlwdGVkIHByaXZhdGUga2V5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjcnlwdFByaXZhdGVLZXkoXG4gIGVuY3J5cHRlZERhdGE6IHN0cmluZyxcbiAgaXY6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgY29uc3QgZGVjaXBoZXIgPSBjcnlwdG8uY3JlYXRlRGVjaXBoZXJpdihcbiAgICAnYWVzLTI1Ni1jYmMnLFxuICAgIEVOQ1JZUFRJT05fS0VZLFxuICAgIEJ1ZmZlci5mcm9tKGl2LCAnaGV4JykgLy8gQ29udmVydCBJViBiYWNrIHRvIGEgQnVmZmVyXG4gICk7XG5cbiAgbGV0IGRlY3J5cHRlZCA9IGRlY2lwaGVyLnVwZGF0ZShlbmNyeXB0ZWREYXRhLCAnaGV4JywgJ3V0Zi04Jyk7XG4gIGRlY3J5cHRlZCArPSBkZWNpcGhlci5maW5hbCgndXRmLTgnKTtcblxuICByZXR1cm4gZGVjcnlwdGVkO1xufSJdLCJuYW1lcyI6WyJjcnlwdG8iLCJFTkNSWVBUSU9OX0tFWV9IRVgiLCJwcm9jZXNzIiwiZW52IiwiVVNFUl9TRUNSRVRfS0VZIiwiRXJyb3IiLCJFTkNSWVBUSU9OX0tFWSIsIkJ1ZmZlciIsImZyb20iLCJsZW5ndGgiLCJJVl9MRU5HVEgiLCJlbmNyeXB0UHJpdmF0ZUtleSIsInByaXZhdGVLZXkiLCJpdiIsInJhbmRvbUJ5dGVzIiwiY2lwaGVyIiwiY3JlYXRlQ2lwaGVyaXYiLCJlbmNyeXB0ZWQiLCJ1cGRhdGUiLCJmaW5hbCIsImVuY3J5cHRlZERhdGEiLCJ0b1N0cmluZyIsImRlY3J5cHRQcml2YXRlS2V5IiwiZGVjaXBoZXIiLCJjcmVhdGVEZWNpcGhlcml2IiwiZGVjcnlwdGVkIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/utils/crypto-utils.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/bcryptjs","vendor-chunks/@ethersproject","vendor-chunks/hash.js","vendor-chunks/inherits","vendor-chunks/scrypt-js","vendor-chunks/minimalistic-assert","vendor-chunks/js-sha3","vendor-chunks/bn.js","vendor-chunks/aes-js"], () => (__webpack_exec__("(rsc)/../node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsignup%2Froute&page=%2Fapi%2Fsignup%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsignup%2Froute.ts&appDir=%2FUsers%2Fjamalward%2Faxis.point%2Ffrontend%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fjamalward%2Faxis.point%2Ffrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();