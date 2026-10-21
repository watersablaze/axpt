import assert from "node:assert/strict";
import { isSameOriginMutation as allows } from "../../src/domains/auth/isSameOriginMutation.ts";
const request=(target,origin,host,extra={})=>new Request(target,{method:"POST",headers:{...(origin===null?{}:{Origin:origin}),...(host===null?{}:{Host:host}),...extra}});
const path="/api/admin/representative-program/commercial-utility-packs/commercial-papers";
for(const environment of ["development","production","test",""]) assert.equal(allows(request("http://127.0.0.1:3117"+path,"http://127.0.0.1:3117","127.0.0.1:3117"),environment),true);
assert.equal(allows(request("http://localhost:3117"+path,"http://127.0.0.1:3117","127.0.0.1:3117"),"development"),true);
assert.equal(allows(request("http://127.0.0.1:3117"+path,"http://localhost:3117","localhost:3117"),"development"),true);
for(const environment of ["production","test",""]) assert.equal(allows(request("http://localhost:3117"+path,"http://127.0.0.1:3117","127.0.0.1:3117"),environment),false);
for(const [target,origin,host] of [
 ["http://localhost:3117",null,"localhost:3117"],
 ["http://localhost:3117","null","localhost:3117"],
 ["http://localhost:3117","http://127.0.0.1:3118","127.0.0.1:3118"],
 ["http://localhost:3117","https://127.0.0.1:3117","127.0.0.1:3117"],
 ["http://localhost:3117","http://evil.invalid:3117","evil.invalid:3117"],
 ["http://localhost:3117","http://127.0.0.1:3117/path","127.0.0.1:3117"],
 ["http://localhost:3117","http://127.0.0.1:3117",null],
 ["http://localhost:3117","http://127.0.0.1:3117","localhost:3117"],
 ["https://www.axpt.io","https://127.0.0.1","127.0.0.1"],
]) assert.equal(allows(request(target+path,origin,host,{"x-forwarded-host":"127.0.0.1:3117"}),"development"),false);
assert.equal(allows(request("https://www.axpt.io"+path,"https://evil.invalid","www.axpt.io"),"production"),false);
console.log("PASS: exact production origins preserved; development loopback alias accepted only with matching browser Host, port and protocol; missing/null/external origins, forwarded-header spoofing and mismatches denied.");
