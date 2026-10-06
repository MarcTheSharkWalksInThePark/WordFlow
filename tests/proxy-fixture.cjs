// Test-only preload. No product flag or exemption; does not connect to any network.
const actual=global.fetch;
global.fetch=async (input,options={})=>{
  const url=new URL(input instanceof Request ? input.url : input);
  if(url.hostname==="cloudflare-dns.com") {
    return Response.json({Status:0,Answer:[{type:url.searchParams.get("type")==="AAAA"?28:1,data:url.searchParams.get("type")==="AAAA"?"2606:4700:4700::1111":"93.184.216.34"}]});
  }
  if(url.hostname==="public-fixture.example") {
    if(url.pathname==="/redirect") return new Response(null,{status:302,headers:{location:"/html"}});
    if(url.pathname==="/missing") return new Response("Fixture not found",{status:404,headers:{"content-type":"text/plain"}});
    if(url.pathname==="/large") return new Response("A".repeat(3*1024*1024+1),{headers:{"content-type":"text/plain"}});
    if(url.pathname==="/plain") return new Response("Non-HTML fixture. Æøå\n",{headers:{"content-type":"text/plain; charset=utf-8"}});
    return new Response("<html><title>Local fixture</title><p>WordFlow local HTML.</p></html>",{headers:{"content-type":"text/html; charset=utf-8"}});
  }
  throw new Error("Unexpected test outbound fetch");
};
