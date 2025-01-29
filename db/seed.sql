-- Insert test music data
INSERT INTO music_library (title, artist, mood, storage_url) VALUES
('SOS Miami Rmx', 'Fifty Fifty', 'Bass', 'bafybeibgqkgzdokcbm3p7gzzvtz5lp5hz5awiqfz6q6epxjzmqxmhz2pku'),
('Cupid', 'Fifty Fifty', 'Kawaii', 'bafybeibgqkgzdokcbm3p7gzzvtz5lp5hz5awiqfz6q6epxjzmqxmhz2pku')
ON CONFLICT (id) DO NOTHING; 