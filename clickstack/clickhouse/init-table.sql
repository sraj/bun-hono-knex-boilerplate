CREATE TABLE IF NOT EXISTS default.app_logs (
    timestamp DateTime NOT NULL,
    level LowCardinality(String) NOT NULL,
    message String NOT NULL,
    request_id Nullable(String),
    method Nullable(String),
    path Nullable(String),
    status Nullable(Int64),
    duration Nullable(Float64),
    err Nullable(String),
    container_name String NOT NULL,
    stream String NOT NULL
) ENGINE = MergeTree()
ORDER BY (toStartOfHour(timestamp), container_name)
TTL toDateTime(timestamp) + INTERVAL 30 DAY
