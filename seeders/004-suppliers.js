  

// seeders/02-suppliers-seeder.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const suppliers = [
      {
        id: 1,
        name: 'PT. Tech Solutions Indonesia',
        address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
        contact_person: 'Ahmad Santoso',
        phone: '+62-21-5551234',
        email: 'ahmad.santoso@techsolutions.co.id',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Main supplier for network equipment and computers'
      },
      {
        id: 2,
        name: 'CV. Digital Hardware Store',
        address: 'Jl. Gajah Mada No. 456, Jakarta Barat 11130',
        contact_person: 'Siti Rahmawati',
        phone: '+62-21-5555678',
        email: 'siti@digitalhardware.com',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Specialized in computer hardware and peripherals'
      },
      {
        id: 3,
        name: 'PT. Server Nusantara',
        address: 'Jl. Thamrin No. 789, Jakarta Pusat 10340',
        contact_person: 'Budi Prasetyo',
        phone: '+62-21-5559876',
        email: 'budi.prasetyo@servernusantara.co.id',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Enterprise server and storage solutions'
      },
      {
        id: 4,
        name: 'Toko Elektronik Maju Jaya',
        address: 'Jl. Mangga Besar No. 321, Jakarta Barat 11180',
        contact_person: 'Ibu Dewi',
        phone: '+62-21-5552468',
        email: 'dewi@majujaya.com',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Local supplier for accessories and small electronics'
      },
      {
        id: 5,
        name: 'PT. Software Lisensi Prima',
        address: 'Jl. Kuningan No. 654, Jakarta Selatan 12950',
        contact_person: 'Andi Kurniawan',
        phone: '+62-21-5553698',
        email: 'andi@softwareprima.co.id',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Software licensing and IT consulting services'
      },
      {
        id: 6,
        name: 'CV. Furniture Office Solutions',
        address: 'Jl. Kemang Raya No. 147, Jakarta Selatan 12560',
        contact_person: 'Rini Susanti',
        phone: '+62-21-5557410',
        email: 'rini@furnituresolutions.com',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Office furniture and interior solutions'
      },
      {
        id: 7,
        name: 'PT. Security Tech Indo',
        address: 'Jl. Casablanca No. 258, Jakarta Selatan 12870',
        contact_person: 'Muhammad Rizki',
        phone: '+62-21-5558520',
        email: 'rizki@securitytech.co.id',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Security systems and surveillance equipment'
      },
      {
        id: 8,
        name: 'Distributor Kabel Indonesia',
        address: 'Jl. Pramuka No. 369, Jakarta Timur 13230',
        contact_person: 'Pak Hendra',
        phone: '+62-21-5554785',
        email: 'hendra@kabelindo.com',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Wholesale cables and network accessories'
      }
    ];

    await queryInterface.bulkInsert('suppliers', suppliers, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('suppliers', null, {});
  }
};