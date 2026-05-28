alter table brokers
add column if not exists user_id uuid unique;