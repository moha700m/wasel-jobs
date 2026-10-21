// Real postings collected from public sources (Oct 2026). Every entry carries its source URL.
const L = {
  seerah: 'https://www.linkedin.com/posts/seerah-company_hiring-officeadministrator-administrativeexecutive-activity-7516479412637405184-KOY4',
  faomco: 'https://ae.linkedin.com/posts/faomco_hiring-riyadhjobs-saudiarabiajobs-activity-7492246345437659136-ZLDo',
  yamas: 'https://dmc-education.com/2026/08/09/yamas-saudi-arabia-jobs-2026-multiple-construction-engineering-vacancies-in-riyadh-and-khobar/',
  aflak: 'https://aflak.com.sa/en/careers',
  jash: 'https://jash.com.sa/careers/',
  alw: 'https://alwzifa.com/93017',
};
// gender: 'm' male-only, 'f' female-only, 'fp'/'mp' preferred (shown to all, flagged), absent = any
const J = (company, title, title_ar, city, email, source, skills, subject_format, posted, kind='vacancy', gender) =>
  ({ company, title, title_ar, city, email, source, skills, subject_format, posted, kind, ...(gender ? { gender } : {}) });
module.exports = [
  J('Seerah Operations & Maintenance','Office & Administrative Executive','موظف/ة إداري ومكتبي','Riyadh','careers@seerah.sa',L.seerah,['admin','office','ms office','communication','documentation','الإدارة','سكرتارية'],null,'2026-10-15','vacancy','fp'),
  J('FAOMCO','Technician – Electrician','فني كهرباء','Riyadh','recruitment@faomco.com',L.faomco,['electrician','electrical','low voltage','medium voltage','كهرباء'],'{title} – {name}','2026-08-09'),
  J('FAOMCO','Technician – HVAC','فني تكييف وتبريد','Riyadh','recruitment@faomco.com',L.faomco,['hvac','air conditioning','mechanical','تكييف','تبريد'],'{title} – {name}','2026-08-09'),
  J('FAOMCO','Technician – Plumber','فني سباكة','Riyadh','recruitment@faomco.com',L.faomco,['plumber','plumbing','سباكة'],'{title} – {name}','2026-08-09'),
  J('FAOMCO','Cleaner – Female','عاملة نظافة','Riyadh','recruitment@faomco.com',L.faomco,['cleaning','housekeeping','soft services','نظافة'],'{title} – {name}','2026-08-09','vacancy','f'),
  J('FAOMCO','Cleaner – Male','عامل نظافة','Riyadh','recruitment@faomco.com',L.faomco,['cleaning','housekeeping','soft services','نظافة'],'{title} – {name}','2026-08-09','vacancy','m'),
  J('FAOMCO','Team Leader – MEP','قائد فريق MEP','Riyadh','recruitment@faomco.com',L.faomco,['mep','team leader','maintenance','facility management'],'{title} – {name}','2026-08-09'),
  J('FAOMCO','Soft Services Manager','مدير الخدمات المساندة','Riyadh','recruitment@faomco.com',L.faomco,['facility management','soft services','manager','operations'],'{title} – {name}','2026-08-09'),
  J('Yamas','Electrical Engineer','مهندس كهرباء','Riyadh','cv@yamas.com.sa',L.yamas,['electrical engineering','autocad','mep','construction','site','هندسة كهربائية'],'{title} – {name}','2026-08-09'),
  J('Yamas','Accountant','محاسب','Khobar','cv@yamas.com.sa',L.yamas,['accounting','finance','erp','excel','محاسبة'],'{title} – {name}','2026-08-09'),
  J('Yamas','Site Supervisor (Civil)','مشرف موقع مدني','Khobar','cv@yamas.com.sa',L.yamas,['civil','site supervision','construction','مدني'],'{title} – {name}','2026-08-09'),
  J('Yamas','Technical Office Engineer','مهندس مكتب فني','Riyadh','cv@yamas.com.sa',L.yamas,['technical office','autocad','civil','shop drawings','construction'],'{title} – {name}','2026-08-09'),
  J('Yamas','Surveyor','مساح','Khobar','cv@yamas.com.sa',L.yamas,['surveying','total station','autocad','مساحة'],'{title} – {name}','2026-08-09'),
  J('Aflak','Mechanical / Electrical Engineer (Fire Safety)','مهندس ميكانيكا/كهرباء (أنظمة السلامة)','Riyadh','jobs@aflak.com.sa',L.aflak,['mechanical engineering','electrical','fire safety','autocad','solidworks'],null,'2026-10-01','vacancy','m'),
  J('Aflak','Furniture Sales Consultant (B2B)','مستشار مبيعات أثاث مكتبي','Riyadh','jobs@aflak.com.sa',L.aflak,['sales','b2b','negotiation','customer','مبيعات'],null,'2026-10-01'),
  J('Jash Holding','Open CV submission – Infrastructure, Tech, Healthcare','تقديم مفتوح – بنية تحتية، تقنية، صحة','Riyadh','careers@jash.com.sa',L.jash,['infrastructure','technology','healthcare','advisory','events'],null,'2026-10-01','open'),
  J('Aldawaa Medical Services','Open CV submission – Pharmacy & Retail','تقديم مفتوح – صيدليات','Saudi Arabia','Cv@aldawaa.com.sa',L.alw,['pharmacist','pharmacy','retail','صيدلي'],null,'2026-01-14','open'),
  J('Rawabi Holding','Open CV submission','تقديم مفتوح','Khobar','Recruitment@rawabiholding.com',L.alw,['engineering','oil and gas','operations','finance'],null,'2026-01-14','open'),
  J('Alojaimi Group','Open CV submission','تقديم مفتوح','Saudi Arabia','Rec@alojaimi.com',L.alw,['admin','sales','engineering'],null,'2026-01-14','open'),
  J('NESR','Open CV submission – Oilfield Services','تقديم مفتوح – خدمات بترولية','Eastern Province','Careers@nesr.com',L.alw,['oil and gas','petroleum','field engineer','hse'],null,'2026-01-14','open'),
  J('Almoosa Hospital','Open CV submission – Healthcare','تقديم مفتوح – صحي','Al Ahsa','Job@almoosahospital.com.sa',L.alw,['nurse','nursing','doctor','pharmacist','healthcare','تمريض'],null,'2026-01-14','open'),
  J('Dr. Sulaiman Al Habib Medical Group','Open CV submission – Healthcare','تقديم مفتوح – صحي','Riyadh','talent.acquisition@drsulaimanalhabib.com',L.alw,['nurse','doctor','healthcare','medical','admin'],null,'2026-01-14','open'),
  J('Innosoft','Open CV submission – IT','تقديم مفتوح – تقنية معلومات','Riyadh','Careers@innosoft.sa',L.alw,['software','developer','it','support','javascript','برمجة'],null,'2026-01-14','open'),
  J('Shawarmer','Open CV submission – Restaurants','تقديم مفتوح – مطاعم','Saudi Arabia','Career@shawarmer.com',L.alw,['restaurant','cashier','customer service','operations','كاشير'],null,'2026-01-14','open'),
];
