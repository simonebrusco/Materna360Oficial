'use client';
import * as React from 'react';

export type TelemetryEvent = {
  id: string;
  ts: number;
  type: 'page_view'|'nav_click'|'card_click'|'coach'|'pdf_export_attempt'|'paywall_shown';
  route?: '/meu-dia'|'/eu360'|'/cuidar'|'/descobrir'|'/maternar'|'/planos'|'/admin/insights';
  meta?: Record<string,string|number|boolean|null>;
};

const KEY='m360.telemetry';

function read(){
  try{
    return JSON.parse(localStorage.getItem(KEY)||'[]');
  }catch{
    return[];
  }
}

function write(a:any[]){
  localStorage.setItem(KEY,JSON.stringify(a));
}

export function useTelemetry(){
  const [data,set]=React.useState<TelemetryEvent[]>([]);
  
  React.useEffect(()=>{
    set(read());
  },[]);
  
  return {
    data,
    clear:()=>{
      write([]);
      set([]);
    },
    seed:(n=100)=>{
      const t=['page_view','nav_click','card_click','coach','pdf_export_attempt','paywall_shown'];
      const r=['/meu-dia','/eu360','/cuidar','/descobrir','/maternar','/planos'];
      const now=Date.now();
      const arr=[];
      for(let i=0;i<n;i++){
        arr.push({
          id:crypto.randomUUID(),
          ts:now-Math.random()*1e9,
          type:t[Math.floor(Math.random()*t.length)] as any,
          route:r[Math.floor(Math.random()*r.length)] as any
        });
      }
      write(arr);
      set(arr);
    }
  };
}
