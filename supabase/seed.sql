insert into venues(id,name,timezone,capacity) values
 ('10000000-0000-4000-8000-000000000001','Harbour Kitchen','Pacific/Auckland',32),
 ('10000000-0000-4000-8000-000000000002','Laneway Dining','Australia/Sydney',24) on conflict do nothing;
insert into dining_tables(id,venue_id,name,seats) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Window 1',4),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Banquette',8),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Courtyard',6) on conflict do nothing;
insert into guests(id,name,email,phone,retention_review_on) values
 ('30000000-0000-4000-8000-000000000001','Mere Wilson','mere@example.test','',current_date+180),
 ('30000000-0000-4000-8000-000000000002','Alex Chen','alex@example.test','',current_date-30),
 ('30000000-0000-4000-8000-000000000003','Alex Carter','carter@example.test','',current_date+180),
 ('30000000-0000-4000-8000-000000000004','Priya Shah','priya@example.test','',current_date+180) on conflict do nothing;
insert into bookings(reference,venue_id,guest_id,table_id,starts_at,ends_at,covers,status,channel,allergy_note,notes) values
 ('DEMO-101','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',now()+interval '1 day',now()+interval '1 day 2 hours',4,'confirmed','phone','Peanut allergy reported','Anniversary'),
 ('DEMO-102','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002',null,now()+interval '1 day',now()+interval '1 day 2 hours',6,'confirmed','website','','Birthday group'),
 ('DEMO-103','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000003',now()+interval '2 days',now()+interval '2 days 2 hours',5,'enquiry','phone','','Needs accessible seating confirmation'),
 ('DEMO-104','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003',null,now()-interval '2 days',now()-interval '1 day 22 hours',2,'confirmed','walk-in','','Outcome not recorded'),
 ('DEMO-105','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002',null,now()-interval '20 days',now()-interval '19 days 22 hours',4,'no-show','website','',''),
 ('DEMO-106','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',null,now()-interval '90 days',now()-interval '89 days 22 hours',2,'completed','phone','',''),
 ('DEMO-107','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002',null,now()-interval '40 days',now()-interval '39 days 22 hours',3,'no-show','website','','') on conflict(reference) do nothing;
