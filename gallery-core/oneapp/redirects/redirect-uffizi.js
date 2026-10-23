export default{async fetch(req){const u=new URL(req.url);return new Response(null,{status:301,headers:{location:'https://tjm.art/play/uffizi/'+u.search,'cache-control':'public, max-age=3600'}});}};
