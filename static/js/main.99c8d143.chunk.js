(this["webpackJsonp@tmpAppart/ui"]=this["webpackJsonp@tmpAppart/ui"]||[]).push([[0],{277:function(t,e,a){"use strict";a.r(e);var n=a(13),o=a(1),i=a.n(o),c=a(152),r=a.n(c),u=a(57),l=a(50),s=a(111),d=a(287),m=a(290),h=a(291),p=a(297),b=a(292),f=a(288),j=a(293),x=a(295),y=function(){window.localStorage.removeItem("token"),window.location.replace("".concat("https://h7bqdxarcb.execute-api.eu-west-3.amazonaws.com/production/api","/tokens?from=").concat(window.location.href))},O=Object(o.createContext)({token:null,login:y}),g=function(t){var e=t.children,a=Object(o.useState)({token:null,login:y}),i=Object(l.a)(a,2),c=i[0],r=i[1];return Object(o.useEffect)((function(){var t,e=new URL(document.location).searchParams;if(e.has("token")&&(t=e.get("token")),t||(t=window.localStorage.getItem("token")),t){if(window.localStorage.setItem("token",t),e.has("token")){e.delete("token");var a=e.toString();window.history.replaceState(void 0,void 0,"".concat(window.location.pathname).concat(a.length>0?"?".concat(a):""))}r((function(e){return Object(u.a)(Object(u.a)({},e),{},{token:t})}))}else y()}),[]),Object(n.jsx)(O.Provider,{value:c,children:e})},w=new Intl.NumberFormat(void 0,{style:"percent"}),v={format:function(t){return new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric"}).format(t)}},k=function(t){return"".concat(new Intl.NumberFormat(void 0,{maximumFractionDigits:0}).format(t),"\xb0C")},S=function(t){var e=t.year,a=t.month,i=t.hide,c=void 0===i?{humidity:!1}:i,r=Object(o.useState)({data:[],maxima:void 0}),u=Object(l.a)(r,2),y=u[0],g=u[1],S=Object(o.useContext)(O),F=S.token,C=S.login;return Object(o.useEffect)((function(){F&&Promise.all(Array.from({length:12}).map((function(t,a){return fetch("".concat("https://h7bqdxarcb.execute-api.eu-west-3.amazonaws.com/production/api","/data?month=").concat(String(a+1).padStart(2,"0"),"&year=").concat(e),{headers:{Accept:"application/json",Authorization:"Bearer ".concat(F)}}).then((function(t){return function(t){return 403===t.status?C():t.json()}})).catch(console.warn)}))).then((function(t){var e=[],a=[],n=[],o=[];t.filter(Boolean).filter((function(t){return!t.error})).map((function(t){return t.data})).flat().forEach((function(t){var i=t.date,c=t.indoor,r=t.outdoor,u=new Date(i).getTime();c&&!c.noValue&&(e.push({tooltipLabel:"indoor: ".concat(k(c.celsius)),x:u,y:c.celsius}),a.push({tooltipLabel:"boiler: ".concat(w.format(c.percentBoiler)),x:u,y:c.percentBoiler})),r&&(n.push({tooltipLabel:"outdoor: ".concat(k(r.celsius)),x:u,y:r.celsius}),o.push({tooltipLabel:"humidity: ".concat(w.format(r.humidity)),x:u,y:r.humidity}))}));var i=[a,o,e,n],c=Math.max.apply(Math,Object(s.a)(e.map((function(t){return t.y}))).concat(Object(s.a)(n.map((function(t){return t.y})))));g({data:i,tempMaxima:c})}))}),[a,F,e]),y.data.length<=0?null:Object(n.jsxs)(d.a,{theme:m.a.material,height:600,width:2e3,scale:{x:"time",y:"linear"},containerComponent:Object(n.jsx)(h.a,{voronoiDimension:"x",labelComponent:Object(n.jsx)(p.a,{cornerRadius:10,flyoutStyle:{fill:"white"}}),labels:function(t){var e=t.datum;return e.tooltipLabel||e.y}}),children:[Object(n.jsx)(b.a,{data:y.data[1],barRatio:.1,alignment:"start",interpolation:"stepBefore",style:{data:{fill:c.humidity?"transparent":"rgb(201, 238, 247)"}}}),Object(n.jsx)(f.a,{data:y.data[0],barRatio:.7,alignment:"start",style:{data:{fill:"rgb(153, 63, 35)"}}}),Object(n.jsx)(j.a,{data:y.data[2],y:function(t){return t.y/y.tempMaxima},style:{data:{stroke:"red"}}}),Object(n.jsx)(j.a,{data:y.data[3],y:function(t){return t.y/y.tempMaxima},style:{data:{stroke:"green"}}}),Object(n.jsx)(x.a,{tickFormat:v.format,tickValues:Array.from({length:12}).map((function(t,a){return new Date("".concat(e,"-").concat(a+1,"-01")).getTime()})).concat(new Date("".concat(e,"-12-31")).getTime())}),Object(n.jsx)(x.a,{dependentAxis:!0,tickFormat:w.format}),Object(n.jsx)(x.a,{dependentAxis:!0,orientation:"right",tickFormat:function(t){return k(t*y.tempMaxima)}})]})},F=function(){var t=Object(o.useState)({humidity:!1}),e=Object(l.a)(t,2),a=e[0],i=e[1],c=(new Date).getUTCFullYear();return Object(n.jsx)(g,{children:Object(n.jsxs)("div",{children:[Object(n.jsx)("input",{type:"checkbox",value:a.humidity,onChange:function(){return i((function(t){return Object(u.a)(Object(u.a)({},t),{},{humidity:!t.humidity})}))}}),"Hide Humidity",Object(n.jsxs)("div",{style:{position:"relative"},children:[c,Object(n.jsx)(S,{year:c,hide:a}),c-1,Object(n.jsx)(S,{year:c-1,hide:a})]})]})})},C=function(t){t&&t instanceof Function&&a.e(3).then(a.bind(null,299)).then((function(e){var a=e.getCLS,n=e.getFID,o=e.getFCP,i=e.getLCP,c=e.getTTFB;a(t),n(t),o(t),i(t),c(t)}))};r.a.render(Object(n.jsx)(i.a.StrictMode,{children:Object(n.jsx)(F,{})}),document.getElementById("root")),C()}},[[277,1,2]]]);
//# sourceMappingURL=main.99c8d143.chunk.js.map