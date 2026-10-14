const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Train, TrainSchedule, TrainFare } = require('../models');

const DEFAULT_TRAINS = [
    {
        train_number: '12801',
        train_name: 'Purushottam Express',
        schedule: [
            { station_code: 'PURI', arrival_time: null, departure_time: '21:55:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'KUR', arrival_time: '22:35:00', departure_time: '22:40:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'BBS', arrival_time: '23:00:00', departure_time: '23:05:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'CTC', arrival_time: '23:35:00', departure_time: '23:40:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'JJKR', arrival_time: '00:31:00', departure_time: '00:33:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'BHC', arrival_time: '01:23:00', departure_time: '01:25:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'BLS', arrival_time: '02:07:00', departure_time: '02:12:00', day_count: 2, stop_sequence: 7 },
            { station_code: 'HIJ', arrival_time: '03:45:00', departure_time: '03:55:00', day_count: 2, stop_sequence: 8 },
            { station_code: 'TATA', arrival_time: '06:22:00', departure_time: '06:32:00', day_count: 2, stop_sequence: 9 },
            { station_code: 'PRR', arrival_time: '08:08:00', departure_time: '08:10:00', day_count: 2, stop_sequence: 10 },
            { station_code: 'BKSC', arrival_time: '09:40:00', departure_time: '09:45:00', day_count: 2, stop_sequence: 11 },
            { station_code: 'GMO', arrival_time: '10:50:00', departure_time: '10:55:00', day_count: 2, stop_sequence: 12 },
            { station_code: 'PNME', arrival_time: '11:10:00', departure_time: '11:12:00', day_count: 2, stop_sequence: 13 },
            { station_code: 'KQR', arrival_time: '12:00:00', departure_time: '12:02:00', day_count: 2, stop_sequence: 14 },
            { station_code: 'GAYA', arrival_time: '13:43:00', departure_time: '13:48:00', day_count: 2, stop_sequence: 15 },
            { station_code: 'DOS', arrival_time: '14:42:00', departure_time: '14:44:00', day_count: 2, stop_sequence: 16 },
            { station_code: 'SSM', arrival_time: '14:58:00', departure_time: '15:00:00', day_count: 2, stop_sequence: 17 },
            { station_code: 'BBU', arrival_time: '15:30:00', departure_time: '15:32:00', day_count: 2, stop_sequence: 18 },
            { station_code: 'MGS', arrival_time: '16:50:00', departure_time: '17:00:00', day_count: 2, stop_sequence: 19 },
            { station_code: 'MZP', arrival_time: '18:01:00', departure_time: '18:03:00', day_count: 2, stop_sequence: 20 },
            { station_code: 'ALD', arrival_time: '19:20:00', departure_time: '19:30:00', day_count: 2, stop_sequence: 21 },
            { station_code: 'FTP', arrival_time: '20:38:00', departure_time: '20:40:00', day_count: 2, stop_sequence: 22 },
            { station_code: 'CNB', arrival_time: '21:55:00', departure_time: '22:00:00', day_count: 2, stop_sequence: 23 },
            { station_code: 'ALJN', arrival_time: '01:38:00', departure_time: '01:40:00', day_count: 3, stop_sequence: 24 },
            { station_code: 'GZB', arrival_time: '03:18:00', departure_time: '03:20:00', day_count: 3, stop_sequence: 25 },
            { station_code: 'NDLS', arrival_time: '04:00:00', departure_time: null, day_count: 3, stop_sequence: 26 }
        ]
    },
    {
        train_number: '12802',
        train_name: 'Purushottam Express (Return)',
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '22:40:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'CNB', arrival_time: '04:00:00', departure_time: '04:05:00', day_count: 2, stop_sequence: 2 },
            { station_code: 'ALD', arrival_time: '06:55:00', departure_time: '07:00:00', day_count: 2, stop_sequence: 3 },
            { station_code: 'MGS', arrival_time: '09:50:00', departure_time: '10:00:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'GAYA', arrival_time: '12:35:00', departure_time: '12:40:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'GMO', arrival_time: '15:25:00', departure_time: '15:30:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'BKSC', arrival_time: '16:35:00', departure_time: '16:40:00', day_count: 2, stop_sequence: 7 },
            { station_code: 'TATA', arrival_time: '19:52:00', departure_time: '20:02:00', day_count: 2, stop_sequence: 8 },
            { station_code: 'HIJ', arrival_time: '22:30:00', departure_time: '22:40:00', day_count: 2, stop_sequence: 9 },
            { station_code: 'BLS', arrival_time: '00:01:00', departure_time: '00:06:00', day_count: 3, stop_sequence: 10 },
            { station_code: 'BHC', arrival_time: '00:58:00', departure_time: '01:00:00', day_count: 3, stop_sequence: 11 },
            { station_code: 'CTC', arrival_time: '02:30:00', departure_time: '02:35:00', day_count: 3, stop_sequence: 12 },
            { station_code: 'BBS', arrival_time: '03:30:00', departure_time: '03:35:00', day_count: 3, stop_sequence: 13 },
            { station_code: 'KUR', arrival_time: '04:00:00', departure_time: '04:05:00', day_count: 3, stop_sequence: 14 },
            { station_code: 'PURI', arrival_time: '05:25:00', departure_time: null, day_count: 3, stop_sequence: 15 }
        ]
    },
    {
        train_number: '12301',
        train_name: 'Howrah Rajdhani Express',
        schedule: [
            { station_code: 'HWH', arrival_time: null, departure_time: '16:50:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'ASN', arrival_time: '18:57:00', departure_time: '19:00:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'DHN', arrival_time: '19:55:00', departure_time: '20:00:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'PNME', arrival_time: '20:30:00', departure_time: '20:32:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'GAYA', arrival_time: '22:19:00', departure_time: '22:22:00', day_count: 1, stop_sequence: 5 },
            { station_code: 'MGS', arrival_time: '00:45:00', departure_time: '00:55:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'ALD', arrival_time: '02:43:00', departure_time: '02:45:00', day_count: 2, stop_sequence: 7 },
            { station_code: 'CNB', arrival_time: '04:50:00', departure_time: '04:55:00', day_count: 2, stop_sequence: 8 },
            { station_code: 'NDLS', arrival_time: '10:05:00', departure_time: null, day_count: 2, stop_sequence: 9 }
        ]
    },
    {
        train_number: '12302',
        train_name: 'New Delhi - Howrah Rajdhani Express',
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '16:55:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'CNB', arrival_time: '21:32:00', departure_time: '21:37:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'ALD', arrival_time: '23:43:00', departure_time: '23:45:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'MGS', arrival_time: '01:42:00', departure_time: '01:52:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'GAYA', arrival_time: '03:55:00', departure_time: '03:58:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'DHN', arrival_time: '06:20:00', departure_time: '06:25:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'ASN', arrival_time: '07:18:00', departure_time: '07:20:00', day_count: 2, stop_sequence: 7 },
            { station_code: 'HWH', arrival_time: '09:55:00', departure_time: null, day_count: 2, stop_sequence: 8 }
        ]
    },
    {
        train_number: '12951',
        train_name: 'Mumbai Central - New Delhi Tejas Rajdhani Express',
        schedule: [
            { station_code: 'BCT', arrival_time: null, departure_time: '17:00:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'BVI', arrival_time: '17:22:00', departure_time: '17:24:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'ST', arrival_time: '19:43:00', departure_time: '19:48:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'BRC', arrival_time: '21:06:00', departure_time: '21:16:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'RTM', arrival_time: '00:25:00', departure_time: '00:28:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'KOTA', arrival_time: '03:15:00', departure_time: '03:20:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'NDLS', arrival_time: '08:32:00', departure_time: null, day_count: 2, stop_sequence: 7 }
        ]
    },
    {
        train_number: '12952',
        train_name: 'New Delhi - Mumbai Central Tejas Rajdhani Express',
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '16:55:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'KOTA', arrival_time: '21:30:00', departure_time: '21:40:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'RTM', arrival_time: '00:27:00', departure_time: '00:30:00', day_count: 2, stop_sequence: 3 },
            { station_code: 'BRC', arrival_time: '03:40:00', departure_time: '03:50:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'ST', arrival_time: '05:13:00', departure_time: '05:18:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'BVI', arrival_time: '07:35:00', departure_time: '07:37:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'BCT', arrival_time: '08:35:00', departure_time: null, day_count: 2, stop_sequence: 7 }
        ]
    },
    {
        train_number: '22436',
        train_name: 'Vande Bharat Express (New Delhi - Varanasi)',
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '06:00:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'CNB', arrival_time: '10:08:00', departure_time: '10:10:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'ALD', arrival_time: '12:08:00', departure_time: '12:10:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'BSB', arrival_time: '14:00:00', departure_time: null, day_count: 1, stop_sequence: 4 }
        ]
    },
    {
        train_number: '22435',
        train_name: 'Vande Bharat Express (Varanasi - New Delhi)',
        schedule: [
            { station_code: 'BSB', arrival_time: null, departure_time: '15:00:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'ALD', arrival_time: '16:30:00', departure_time: '16:32:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'CNB', arrival_time: '18:30:00', departure_time: '18:32:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'NDLS', arrival_time: '23:00:00', departure_time: null, day_count: 1, stop_sequence: 4 }
        ]
    },
    {
        train_number: '12002',
        train_name: 'Bhopal Shatabdi Express',
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '06:00:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'MTJ', arrival_time: '07:19:00', departure_time: '07:20:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'AGC', arrival_time: '07:50:00', departure_time: '07:55:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'GWL', arrival_time: '09:23:00', departure_time: '09:28:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'JHS', arrival_time: '10:45:00', departure_time: '10:50:00', day_count: 1, stop_sequence: 5 },
            { station_code: 'BPL', arrival_time: '14:07:00', departure_time: '14:12:00', day_count: 1, stop_sequence: 6 },
            { station_code: 'HBJ', arrival_time: '14:40:00', departure_time: null, day_count: 1, stop_sequence: 7 }
        ]
    },
    {
        train_number: '12004',
        train_name: 'Lucknow Shatabdi Express',
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '06:10:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'GZB', arrival_time: '06:48:00', departure_time: '06:50:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'ALJN', arrival_time: '07:47:00', departure_time: '07:49:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'TDL', arrival_time: '08:45:00', departure_time: '08:47:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'CNB', arrival_time: '11:20:00', departure_time: '11:25:00', day_count: 1, stop_sequence: 5 },
            { station_code: 'LKO', arrival_time: '12:55:00', departure_time: null, day_count: 1, stop_sequence: 6 }
        ]
    },
    {
        train_number: '12626',
        train_name: 'Kerala Express',
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '20:10:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'MTJ', arrival_time: '21:38:00', departure_time: '21:40:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'AGC', arrival_time: '22:20:00', departure_time: '22:25:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'GWL', arrival_time: '00:03:00', departure_time: '00:05:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'JHS', arrival_time: '01:30:00', departure_time: '01:38:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'BPL', arrival_time: '05:20:00', departure_time: '05:25:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'NGP', arrival_time: '11:45:00', departure_time: '11:50:00', day_count: 2, stop_sequence: 7 },
            { station_code: 'BPQ', arrival_time: '15:15:00', departure_time: '15:20:00', day_count: 2, stop_sequence: 8 },
            { station_code: 'RDM', arrival_time: '16:59:00', departure_time: '17:00:00', day_count: 2, stop_sequence: 9 },
            { station_code: 'BZA', arrival_time: '22:15:00', departure_time: '22:25:00', day_count: 2, stop_sequence: 10 },
            { station_code: 'RU', arrival_time: '04:15:00', departure_time: '04:20:00', day_count: 3, stop_sequence: 11 },
            { station_code: 'KPD', arrival_time: '06:45:00', departure_time: '06:50:00', day_count: 3, stop_sequence: 12 },
            { station_code: 'CBE', arrival_time: '13:07:00', departure_time: '13:10:00', day_count: 3, stop_sequence: 13 },
            { station_code: 'PGT', arrival_time: '14:15:00', departure_time: '14:20:00', day_count: 3, stop_sequence: 14 },
            { station_code: 'TCR', arrival_time: '15:27:00', departure_time: '15:30:00', day_count: 3, stop_sequence: 15 },
            { station_code: 'ERS', arrival_time: '16:55:00', departure_time: '17:00:00', day_count: 3, stop_sequence: 16 },
            { station_code: 'TVC', arrival_time: '21:55:00', departure_time: null, day_count: 3, stop_sequence: 17 }
        ]
    },
    {
        train_number: '12926',
        train_name: 'Paschim Superfast Express',
        schedule: [
            { station_code: 'ASR', arrival_time: null, departure_time: '07:35:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'LDH', arrival_time: '10:00:00', departure_time: '10:10:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'UMB', arrival_time: '12:05:00', departure_time: '12:15:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'NDLS', arrival_time: '16:20:00', departure_time: '16:35:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'MTJ', arrival_time: '19:10:00', departure_time: '19:15:00', day_count: 1, stop_sequence: 5 },
            { station_code: 'KOTA', arrival_time: '23:30:00', departure_time: '23:40:00', day_count: 1, stop_sequence: 6 },
            { station_code: 'RTM', arrival_time: '03:40:00', departure_time: '03:50:00', day_count: 2, stop_sequence: 7 },
            { station_code: 'BRC', arrival_time: '07:25:00', departure_time: '07:35:00', day_count: 2, stop_sequence: 8 },
            { station_code: 'ST', arrival_time: '09:30:00', departure_time: '09:35:00', day_count: 2, stop_sequence: 9 },
            { station_code: 'BDTS', arrival_time: '14:45:00', departure_time: null, day_count: 2, stop_sequence: 10 }
        ]
    },
    {
        train_number: '20607',
        train_name: 'Chennai - Mysuru Vande Bharat Express',
        schedule: [
            { station_code: 'MAS', arrival_time: null, departure_time: '05:50:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'KPD', arrival_time: '07:13:00', departure_time: '07:15:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'SBC', arrival_time: '10:15:00', departure_time: '10:20:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'MYS', arrival_time: '12:20:00', departure_time: null, day_count: 1, stop_sequence: 4 }
        ]
    },
    {
        train_number: '12723',
        train_name: 'Telangana Express',
        schedule: [
            { station_code: 'HYB', arrival_time: null, departure_time: '06:00:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'SC', arrival_time: '06:20:00', departure_time: '06:25:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'KZJ', arrival_time: '08:03:00', departure_time: '08:05:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'RDM', arrival_time: '09:28:00', departure_time: '09:30:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'BPQ', arrival_time: '12:00:00', departure_time: '12:05:00', day_count: 1, stop_sequence: 5 },
            { station_code: 'NGP', arrival_time: '15:20:00', departure_time: '15:25:00', day_count: 1, stop_sequence: 6 },
            { station_code: 'BPL', arrival_time: '21:45:00', departure_time: '21:55:00', day_count: 1, stop_sequence: 7 },
            { station_code: 'JHS', arrival_time: '01:15:00', departure_time: '01:23:00', day_count: 2, stop_sequence: 8 },
            { station_code: 'GWL', arrival_time: '02:40:00', departure_time: '02:42:00', day_count: 2, stop_sequence: 9 },
            { station_code: 'AGC', arrival_time: '04:55:00', departure_time: '05:00:00', day_count: 2, stop_sequence: 10 },
            { station_code: 'MTJ', arrival_time: '05:40:00', departure_time: '05:42:00', day_count: 2, stop_sequence: 11 },
            { station_code: 'NDLS', arrival_time: '07:40:00', departure_time: null, day_count: 2, stop_sequence: 12 }
        ]
    },
    {
        train_number: '22428',
        train_name: 'Bhrigu Superfast Express',
        runs_on: ['MON', 'WED', 'FRI'],
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '23:55:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'ANVT', arrival_time: '00:10:00', departure_time: '00:15:00', day_count: 2, stop_sequence: 2 },
            { station_code: 'ALJN', arrival_time: '01:38:00', departure_time: '01:40:00', day_count: 2, stop_sequence: 3 },
            { station_code: 'CNB', arrival_time: '05:20:00', departure_time: '05:25:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'ALD', arrival_time: '08:20:00', departure_time: '08:25:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'GCT', arrival_time: '12:35:00', departure_time: '12:40:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'BUI', arrival_time: '14:00:00', departure_time: null, day_count: 2, stop_sequence: 7 }
        ]
    },
    {
        train_number: '15126',
        train_name: 'Jan Shatabdi Intercity Express',
        schedule: [
            { station_code: 'BSB', arrival_time: null, departure_time: '17:20:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'DDU', arrival_time: '18:00:00', departure_time: '18:10:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'MGS', arrival_time: '18:00:00', departure_time: '18:10:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'GCT', arrival_time: '19:15:00', departure_time: '19:20:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'BUI', arrival_time: '20:30:00', departure_time: null, day_count: 1, stop_sequence: 4 }
        ]
    },
    {
        train_number: '11088',
        train_name: 'Pune - Veraval Express',
        schedule: [
            { station_code: 'PUNE', arrival_time: null, departure_time: '20:10:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'LNL', arrival_time: '20:58:00', departure_time: '21:00:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'KYN', arrival_time: '22:25:00', departure_time: '22:30:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'BSR', arrival_time: '23:45:00', departure_time: '23:55:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'ST', arrival_time: '03:10:00', departure_time: '03:15:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'BRC', arrival_time: '04:45:00', departure_time: '04:55:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'ADI', arrival_time: '07:20:00', departure_time: null, day_count: 2, stop_sequence: 7 }
        ]
    },
    {
        train_number: '12995',
        train_name: 'Bandra Terminus - Udaipur City Superfast Express',
        schedule: [
            { station_code: 'BDTS', arrival_time: null, departure_time: '16:15:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'BSR', arrival_time: '01:45:00', departure_time: '01:55:00', day_count: 2, stop_sequence: 3 },
            { station_code: 'ST', arrival_time: '04:40:00', departure_time: '04:45:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'BRC', arrival_time: '06:20:00', departure_time: '06:30:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'RTM', arrival_time: '09:45:00', departure_time: '09:55:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'COR', arrival_time: '12:35:00', departure_time: '12:45:00', day_count: 2, stop_sequence: 7 },
            { station_code: 'UDZ', arrival_time: '14:05:00', departure_time: null, day_count: 2, stop_sequence: 8 }
        ]
    },
    {
        train_number: '20980',
        train_name: 'Ahmedabad - Udaipur City Superfast Intercity',
        schedule: [
            { station_code: 'ADI', arrival_time: null, departure_time: '09:15:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'HMT', arrival_time: '10:38:00', departure_time: '10:40:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'COR', arrival_time: '12:55:00', departure_time: '13:00:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'UDZ', arrival_time: '14:15:00', departure_time: null, day_count: 1, stop_sequence: 4 }
        ]
    },
    {
        train_number: '22943',
        train_name: 'Pune - Indore Express',
        schedule: [
            { station_code: 'PUNE', arrival_time: null, departure_time: '15:30:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'KYN', arrival_time: '17:40:00', departure_time: '17:45:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'BSR', arrival_time: '18:40:00', departure_time: '18:45:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'ST', arrival_time: '21:45:00', departure_time: '21:50:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'BRC', arrival_time: '23:20:00', departure_time: '23:30:00', day_count: 1, stop_sequence: 5 },
            { station_code: 'RTM', arrival_time: '03:00:00', departure_time: null, day_count: 2, stop_sequence: 6 }
        ]
    },
    {
        train_number: '19327',
        train_name: 'Ratlam - Udaipur City Express',
        schedule: [
            { station_code: 'RTM', arrival_time: null, departure_time: '04:45:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'JAO', arrival_time: '05:28:00', departure_time: '05:30:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'MDS', arrival_time: '06:10:00', departure_time: '06:15:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'COR', arrival_time: '07:45:00', departure_time: '07:55:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'UDZ', arrival_time: '09:30:00', departure_time: null, day_count: 1, stop_sequence: 5 }
        ]
    },
    {
        train_number: '12533',
        train_name: 'Pushpak Express',
        schedule: [
            { station_code: 'LKO', arrival_time: null, departure_time: '21:25:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'CNB', arrival_time: '22:40:00', departure_time: '22:45:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'BPL', arrival_time: '07:05:00', departure_time: '07:15:00', day_count: 2, stop_sequence: 3 },
            { station_code: 'BSL', arrival_time: '11:58:00', departure_time: '12:05:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'KYN', arrival_time: '16:22:00', departure_time: '16:25:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'CSMT', arrival_time: '17:30:00', departure_time: null, day_count: 2, stop_sequence: 6 }
        ]
    },
    {
        train_number: '12310',
        train_name: 'Patna Rajdhani Express',
        runs_on: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '17:10:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'CNB', arrival_time: '21:52:00', departure_time: '21:57:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'PRYJ', arrival_time: '00:05:00', departure_time: '00:07:00', day_count: 2, stop_sequence: 3 },
            { station_code: 'DDU', arrival_time: '02:00:00', departure_time: '02:10:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'DNR', arrival_time: '04:40:00', departure_time: '04:42:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'PNBE', arrival_time: '05:15:00', departure_time: '05:25:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'RJPB', arrival_time: '05:40:00', departure_time: null, day_count: 2, stop_sequence: 7 }
        ]
    },
    {
        train_number: '12309',
        train_name: 'Patna - New Delhi Rajdhani Express',
        runs_on: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'RJPB', arrival_time: null, departure_time: '19:10:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'PNBE', arrival_time: '19:25:00', departure_time: '19:35:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'DNR', arrival_time: '19:50:00', departure_time: '19:52:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'DDU', arrival_time: '22:12:00', departure_time: '22:22:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'PRYJ', arrival_time: '00:10:00', departure_time: '00:12:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'CNB', arrival_time: '02:15:00', departure_time: '02:20:00', day_count: 2, stop_sequence: 6 },
            { station_code: 'NDLS', arrival_time: '07:40:00', departure_time: null, day_count: 2, stop_sequence: 7 }
        ]
    },
    {
        train_number: '12394',
        train_name: 'Sampoorna Kranti Express',
        runs_on: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '17:30:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'CNB', arrival_time: '22:22:00', departure_time: '22:30:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'DDU', arrival_time: '02:25:00', departure_time: '02:35:00', day_count: 2, stop_sequence: 3 },
            { station_code: 'DNR', arrival_time: '05:45:00', departure_time: '05:47:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'PNBE', arrival_time: '06:50:00', departure_time: '07:00:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'RJPB', arrival_time: '07:20:00', departure_time: null, day_count: 2, stop_sequence: 6 }
        ]
    },
    {
        train_number: '12393',
        train_name: 'Sampoorna Kranti Express (Return)',
        runs_on: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'RJPB', arrival_time: null, departure_time: '19:25:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'PNBE', arrival_time: '19:40:00', departure_time: '19:50:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'DNR', arrival_time: '20:08:00', departure_time: '20:10:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'DDU', arrival_time: '22:20:00', departure_time: '22:30:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'CNB', arrival_time: '02:25:00', departure_time: '02:30:00', day_count: 2, stop_sequence: 5 },
            { station_code: 'NDLS', arrival_time: '07:55:00', departure_time: null, day_count: 2, stop_sequence: 6 }
        ]
    },
    {
        train_number: '12566',
        train_name: 'Bihar Sampark Kranti Express',
        runs_on: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'NDLS', arrival_time: null, departure_time: '13:00:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'CNB', arrival_time: '18:10:00', departure_time: '18:15:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'GKP', arrival_time: '00:55:00', departure_time: '01:05:00', day_count: 2, stop_sequence: 3 },
            { station_code: 'CPR', arrival_time: '03:45:00', departure_time: '03:50:00', day_count: 2, stop_sequence: 4 },
            { station_code: 'PPTA', arrival_time: '05:20:00', departure_time: null, day_count: 2, stop_sequence: 5 }
        ]
    },
    {
        train_number: '12565',
        train_name: 'Bihar Sampark Kranti Express (Return)',
        runs_on: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'PPTA', arrival_time: null, departure_time: '11:25:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'CPR', arrival_time: '12:55:00', departure_time: '13:05:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'GKP', arrival_time: '15:45:00', departure_time: '15:55:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'CNB', arrival_time: '22:48:00', departure_time: '22:58:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'NDLS', arrival_time: '05:15:00', departure_time: null, day_count: 2, stop_sequence: 5 }
        ]
    },
    {
        train_number: '18183',
        train_name: 'Tatanagar - Danapur Super Express',
        runs_on: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'TATA', arrival_time: null, departure_time: '08:15:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'PRR', arrival_time: '09:28:00', departure_time: '09:30:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'BKSC', arrival_time: '10:40:00', departure_time: '10:45:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'GMO', arrival_time: '11:55:00', departure_time: '12:00:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'KQR', arrival_time: '13:05:00', departure_time: '13:07:00', day_count: 1, stop_sequence: 5 },
            { station_code: 'GAYA', arrival_time: '14:45:00', departure_time: '14:50:00', day_count: 1, stop_sequence: 6 },
            { station_code: 'PNBE', arrival_time: '18:25:00', departure_time: '18:35:00', day_count: 1, stop_sequence: 7 },
            { station_code: 'DNR', arrival_time: '19:00:00', departure_time: null, day_count: 1, stop_sequence: 8 }
        ]
    },
    {
        train_number: '18184',
        train_name: 'Danapur - Tatanagar Super Express (Return)',
        runs_on: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'DNR', arrival_time: null, departure_time: '05:45:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'PNBE', arrival_time: '06:05:00', departure_time: '06:15:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'GAYA', arrival_time: '08:00:00', departure_time: '08:05:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'KQR', arrival_time: '09:28:00', departure_time: '09:30:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'GMO', arrival_time: '10:45:00', departure_time: '10:50:00', day_count: 1, stop_sequence: 5 },
            { station_code: 'BKSC', arrival_time: '11:55:00', departure_time: '12:00:00', day_count: 1, stop_sequence: 6 },
            { station_code: 'PRR', arrival_time: '13:10:00', departure_time: '13:12:00', day_count: 1, stop_sequence: 7 },
            { station_code: 'TATA', arrival_time: '14:50:00', departure_time: null, day_count: 1, stop_sequence: 8 }
        ]
    },
    {
        train_number: '20834',
        train_name: 'Tatanagar - Patna Vande Bharat Express',
        runs_on: ["MON", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'TATA', arrival_time: null, departure_time: '05:30:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'BKSC', arrival_time: '07:33:00', departure_time: '07:35:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'GMO', arrival_time: '08:08:00', departure_time: '08:10:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'GAYA', arrival_time: '09:43:00', departure_time: '09:48:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'PNBE', arrival_time: '11:55:00', departure_time: null, day_count: 1, stop_sequence: 5 }
        ]
    },
    {
        train_number: '20833',
        train_name: 'Patna - Tatanagar Vande Bharat Express (Return)',
        runs_on: ["MON", "WED", "THU", "FRI", "SAT", "SUN"],
        schedule: [
            { station_code: 'PNBE', arrival_time: null, departure_time: '14:15:00', day_count: 1, stop_sequence: 1 },
            { station_code: 'GAYA', arrival_time: '16:15:00', departure_time: '16:20:00', day_count: 1, stop_sequence: 2 },
            { station_code: 'GMO', arrival_time: '18:00:00', departure_time: '18:02:00', day_count: 1, stop_sequence: 3 },
            { station_code: 'BKSC', arrival_time: '18:40:00', departure_time: '18:42:00', day_count: 1, stop_sequence: 4 },
            { station_code: 'TATA', arrival_time: '20:45:00', departure_time: null, day_count: 1, stop_sequence: 5 }
        ]
    }
];

async function seedDefaultTrains() {
    console.log('Seeding built-in popular trains & schedules...');
    for (const item of DEFAULT_TRAINS) {
        const src = item.schedule && item.schedule.length > 0 ? item.schedule[0].station_code : 'NDLS';
        const dst = item.schedule && item.schedule.length > 0 ? item.schedule[item.schedule.length - 1].station_code : 'BBS';
        await Train.findOrCreate({
            where: { train_number: item.train_number },
            defaults: {
                train_number: item.train_number,
                train_name: item.train_name,
                source_station: src,
                destination_station: dst,
                runs_on: item.runs_on || ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
                service_type: 'Express',
                frequency: item.runs_on ? `${item.runs_on.length} days/week` : 'Daily'
            }
        });

        // Insert schedules
        for (const sch of item.schedule) {
            await TrainSchedule.findOrCreate({
                where: {
                    train_number: item.train_number,
                    stop_sequence: sch.stop_sequence
                },
                defaults: {
                    train_number: item.train_number,
                    station_code: sch.station_code,
                    arrival_time: sch.arrival_time,
                    departure_time: sch.departure_time,
                    day_count: sch.day_count,
                    stop_sequence: sch.stop_sequence
                }
            });
        }
    }
    console.log(`✅ Seeded ${DEFAULT_TRAINS.length} built-in trains and schedules successfully.`);
}

const seedTrains = async () => {
    try {
        const count = await Train.count();
        if (count > 0) {
            console.log('Trains already seeded. Skipping...');
            return;
        }

        const possiblePaths = [
            path.join(__dirname, '../../ai-services/data/Trains schedule.csv'),
            path.join(__dirname, '../../ai-service/data/Trains schedule.csv'),
            path.join(__dirname, '../data/Trains schedule.csv')
        ];
        const dataPath = possiblePaths.find(p => fs.existsSync(p));
        if (!dataPath) {
            console.log('Trains schedule.csv not found. Falling back to built-in express train dataset.');
            await seedDefaultTrains();
            return;
        }

        console.log('Parsing Trains schedule.csv... This may take a few minutes due to 77MB size.');

        const trainsMap = new Map(); // train_number -> train_name
        const schedules = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(dataPath)
                .pipe(csv({
                    mapHeaders: ({ header }) => header.trim()
                }))
                .on('data', (row) => {
                    const train_number = row['train_number']?.trim();
                    const train_name = row['train_name']?.trim();
                    const station_code = row['station_code']?.trim();
                    const arrival_time = row['arrival']?.trim() || null;
                    const departure_time = row['departure']?.trim() || null;
                    const day_count = parseInt(row['day']) || 1;
                    const stop_sequence = parseInt(row['id']) || 0;

                    if (!train_number || !station_code) return;

                    if (!trainsMap.has(train_number)) {
                        trainsMap.set(train_number, train_name);
                    }

                    schedules.push({
                        train_number,
                        station_code,
                        arrival_time,
                        departure_time,
                        day_count,
                        stop_sequence
                    });
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Found ${trainsMap.size} unique trains and ${schedules.length} stops.`);
        console.log('Inserting trains...');

        const uniqueTrains = Array.from(trainsMap.entries()).map(([num, name]) => ({
            train_number: num,
            train_name: name
        }));

        // Insert trains in chunks
        const trainChunkSize = 1000;
        for (let i = 0; i < uniqueTrains.length; i += trainChunkSize) {
            await Train.bulkCreate(uniqueTrains.slice(i, i + trainChunkSize), { ignoreDuplicates: true });
            console.log(`Inserted trains ${Math.min(i + trainChunkSize, uniqueTrains.length)} / ${uniqueTrains.length}`);
        }

        console.log('Inserting train schedules in chunks...');
        const scheduleChunkSize = 10000;
        for (let i = 0; i < schedules.length; i += scheduleChunkSize) {
            await TrainSchedule.bulkCreate(schedules.slice(i, i + scheduleChunkSize), { ignoreDuplicates: true });
            if (i % 50000 === 0) {
                console.log(`Inserted schedules ${Math.min(i + scheduleChunkSize, schedules.length)} / ${schedules.length}`);
            }
        }

        console.log('Successfully seeded all trains and schedules from CSV!');

    } catch (error) {
        console.error('Error seeding trains:', error);
    }
};

module.exports = { seedTrains, seedDefaultTrains };

