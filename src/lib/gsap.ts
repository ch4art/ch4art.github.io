// GSAP 唯一註冊點。整站只允許從這裡 import gsap —— 禁止 'gsap/all'、
// 禁止散落各處的 registerPlugin(bundle 紀律:core ~23KB + ScrollTrigger ~13KB)。
// SplitText 刻意不用:hero 貼紙標題的雙層機制(::before content:attr(data-text))
// 跟字符拆分互斥;Flip 也不用:燈箱的 CSS pop-in 已足夠。
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
