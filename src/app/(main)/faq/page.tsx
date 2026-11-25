import type { Metadata } from "next";
import { prisma } from "@/infrastructure/database/prisma";
import LegacyFAQPage from "./../legacy-routes/faq";
async function loadPage(){return prisma.page.findFirst({where:{slug:"faq",status:"PUBLISHED",deletedAt:null},include:{seo:true}})}
export async function generateMetadata():Promise<Metadata>{const page=await loadPage();return{title:page?.seo?.title??"FAQ",description:page?.seo?.description??undefined}}
export default async function FAQPage(){const faqs=await prisma.faq.findMany({where:{status:"PUBLISHED",deletedAt:null},orderBy:{createdAt:"asc"}});return <><LegacyFAQPage/><div className="sr-only">{faqs.flatMap((faq)=>[faq.question,faq.answer]).join(" ")}</div></>}
