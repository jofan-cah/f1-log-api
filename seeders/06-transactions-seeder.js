
// seeders/06-transactions-seeder.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transactions = [
      {
        id: 1,
        transaction_type: 'check_out',
        reference_no: 'CO-20241201-001',
        first_person: 'John Doe',
        second_person: 'IT Admin',
        location: 'Office Floor 1 - Desk 01',
        transaction_date: '2024-12-01 09:00:00',
        notes: 'Computer assignment for new employee',
        status: 'closed',
        created_at: new Date(),
        created_by: 'admin'
      },
      {
        id: 2,
        transaction_type: 'check_out',
        reference_no: 'CO-20241205-002',
        first_person: 'Jane Smith',
        second_person: 'IT Admin',
        location: 'Office Floor 1 - Desk 02',
        transaction_date: '2024-12-05 10:30:00',
        notes: 'Monitor deployment for workstation',
        status: 'closed',
        created_at: new Date(),
        created_by: 'admin'
      },
      {
        id: 3,
        transaction_type: 'maintenance',
        reference_no: 'MT-20241210-003',
        first_person: 'IT Technician',
        second_person: null,
        location: 'Server Room A',
        transaction_date: '2024-12-10 14:00:00',
        notes: 'Scheduled maintenance for network switch',
        status: 'open',
        created_at: new Date(),
        created_by: 'admin'
      },
      {
        id: 4,
        transaction_type: 'transfer',
        reference_no: 'TR-20241215-004',
        first_person: 'Storage Admin',
        second_person: 'Office Manager',
        location: 'Office Floor 1',
        transaction_date: '2024-12-15 11:00:00',
        notes: 'Transfer peripherals from storage to office',
        status: 'closed',
        created_at: new Date(),
        created_by: 'admin'
      }
    ];

    await queryInterface.bulkInsert('transactions', transactions, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('transactions', null, {});
  }
};
