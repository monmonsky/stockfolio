-- Create stocks table (transaksi saham)
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(10) NOT NULL,
    stock_name VARCHAR(100),
    lot_quantity INTEGER NOT NULL,
    buy_price DECIMAL(15, 2) NOT NULL,
    buy_date DATE NOT NULL,
    broker_fee DECIMAL(15, 2) DEFAULT 0,
    current_price DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dividends table (dividen)
CREATE TABLE IF NOT EXISTS dividends (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE SET NULL,
    stock_code VARCHAR(10) NOT NULL,
    dividend_per_share DECIMAL(15, 2) NOT NULL,
    total_shares INTEGER NOT NULL,
    total_dividend DECIMAL(15, 2) NOT NULL,
    cum_date DATE,
    payment_date DATE,
    payment_month INTEGER NOT NULL CHECK (payment_month >= 1 AND payment_month <= 12),
    payment_year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_stocks_code ON stocks(stock_code);
CREATE INDEX idx_dividends_stock_code ON dividends(stock_code);
CREATE INDEX idx_dividends_payment ON dividends(payment_year, payment_month);

-- Insert sample data untuk testing
INSERT INTO stocks (stock_code, stock_name, lot_quantity, buy_price, buy_date, broker_fee, current_price) VALUES
('BBCA', 'Bank Central Asia Tbk', 10, 9500, '2025-01-15', 15000, 10200),
('TLKM', 'Telkom Indonesia Tbk', 20, 3800, '2025-02-10', 12000, 3500),
('ASII', 'Astra International Tbk', 15, 5200, '2025-03-05', 13000, 5500);

INSERT INTO dividends (stock_id, stock_code, dividend_per_share, total_shares, total_dividend, cum_date, payment_date, payment_month, payment_year) VALUES
(1, 'BBCA', 250, 1000, 250000, '2025-03-20', '2025-04-10', 4, 2025),
(2, 'TLKM', 150, 2000, 300000, '2025-04-15', '2025-05-05', 5, 2025),
(3, 'ASII', 200, 1500, 300000, '2025-05-20', '2025-06-10', 6, 2025);
