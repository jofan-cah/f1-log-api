// seeders/05-products-seeder.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = [
      // Network Equipment
      {
        product_id: 'NET001',
        category_id: 1,
        brand: 'Cisco',
        model: '2960X-24TS-L',
        serial_number: 'FCW2140L0AB',
        origin: 'Singapore',
        supplier_id: 1,
        po_number: 'PO-2024-NET-001',
        receipt_item_id: 1,
        description: '24-port Gigabit Ethernet Switch',
        location: 'Server Room A',
        img_product: null,
        status: 'Available',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-12-01',
        purchase_price: 15000000.00,
        warranty_expiry: '2027-12-01',
        last_maintenance_date: null,
        next_maintenance_date: '2025-06-01',
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Main switch for floor 1'
      },
      {
        product_id: 'NET002',
        category_id: 1,
        brand: 'Cisco',
        model: '2960X-24TS-L',
        serial_number: 'FCW2140L0AC',
        origin: 'Singapore',
        supplier_id: 1,
        po_number: 'PO-2024-NET-001',
        receipt_item_id: 1,
        description: '24-port Gigabit Ethernet Switch',
        location: 'Server Room B',
        img_product: null,
        status: 'In Use',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-12-01',
        purchase_price: 15000000.00,
        warranty_expiry: '2027-12-01',
        last_maintenance_date: null,
        next_maintenance_date: '2025-06-01',
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Backup switch for floor 2'
      },
      // Computer Hardware
      {
        product_id: 'COM001',
        category_id: 2,
        brand: 'Dell',
        model: 'OptiPlex 7090',
        serial_number: 'DL001',
        origin: 'Malaysia',
        supplier_id: 2,
        po_number: 'PO-2024-COM-002',
        receipt_item_id: 2,
        description: 'Desktop Computer i5-11500',
        location: 'Office Floor 1 - Desk 01',
        img_product: null,
        status: 'In Use',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-12-05',
        purchase_price: 12500000.00,
        warranty_expiry: '2027-12-05',
        last_maintenance_date: null,
        next_maintenance_date: '2025-06-05',
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Assigned to Marketing Dept - John Doe'
      },
      {
        product_id: 'COM002',
        category_id: 2,
        brand: 'Dell',
        model: 'OptiPlex 7090',
        serial_number: 'DL002',
        origin: 'Malaysia',
        supplier_id: 2,
        po_number: 'PO-2024-COM-002',
        receipt_item_id: 2,
        description: 'Desktop Computer i5-11500',
        location: 'Office Floor 1 - Desk 02',
        img_product: null,
        status: 'Available',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-12-05',
        purchase_price: 12500000.00,
        warranty_expiry: '2027-12-05',
        last_maintenance_date: null,
        next_maintenance_date: '2025-06-05',
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Ready for deployment'
      },
      // Server Equipment
      {
        product_id: 'SRV001',
        category_id: 3,
        brand: 'Dell',
        model: 'PowerEdge R750',
        serial_number: 'SVR001',
        origin: 'USA',
        supplier_id: 3,
        po_number: 'PO-2024-SRV-003',
        receipt_item_id: 3,
        description: 'Rack Server 2U - Xeon Silver 4314',
        location: 'Data Center Rack A1',
        img_product: null,
        status: 'In Use',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-12-10',
        purchase_price: 125000000.00,
        warranty_expiry: '2029-12-10',
        last_maintenance_date: null,
        next_maintenance_date: '2025-03-10',
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Primary application server'
      },
      // Peripherals
      {
        product_id: 'PER001',
        category_id: 5,
        brand: 'Logitech',
        model: 'MX Keys',
        serial_number: null,
        origin: 'China',
        supplier_id: 4,
        po_number: 'PO-2024-PER-004',
        receipt_item_id: 4,
        description: 'Wireless Keyboard',
        location: 'Storage Room A',
        img_product: null,
        status: 'Available',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-12-15',
        purchase_price: 500000.00,
        warranty_expiry: '2026-12-15',
        last_maintenance_date: null,
        next_maintenance_date: null,
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Stock item for office deployment'
      },
      {
        product_id: 'PER002',
        category_id: 5,
        brand: 'LG',
        model: '24MK430H-B',
        serial_number: 'MON001',
        origin: 'Korea',
        supplier_id: 4,
        po_number: 'PO-2024-PER-004',
        receipt_item_id: 6,
        description: '24" Full HD LED Monitor',
        location: 'Office Floor 1 - Desk 01',
        img_product: null,
        status: 'In Use',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-12-15',
        purchase_price: 900000.00,
        warranty_expiry: '2026-12-15',
        last_maintenance_date: null,
        next_maintenance_date: null,
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Paired with COM001'
      },
      // Office Furniture (non-stock category)
      {
        product_id: 'FUR001',
        category_id: 9,
        brand: 'IKEA',
        model: 'BEKANT',
        serial_number: null,
        origin: 'Indonesia',
        supplier_id: 6,
        po_number: 'PO-2024-FUR-005',
        receipt_item_id: null,
        description: 'Office Desk 160x80cm White',
        location: 'Office Floor 1 - Desk 01',
        img_product: null,
        status: 'In Use',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-11-20',
        purchase_price: 1500000.00,
        warranty_expiry: '2026-11-20',
        last_maintenance_date: null,
        next_maintenance_date: null,
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Workstation desk for marketing team'
      },
      // Mobile Device (low stock category)
      {
        product_id: 'MOB001',
        category_id: 10,
        brand: 'Samsung',
        model: 'Galaxy Tab S8',
        serial_number: 'TAB001',
        origin: 'Korea',
        supplier_id: 1,
        po_number: 'PO-2024-MOB-006',
        receipt_item_id: null,
        description: '11" Android Tablet 128GB',
        location: 'IT Department',
        img_product: null,
        status: 'Available',
        condition: 'New',
        quantity: 1,
        purchase_date: '2024-11-25',
        purchase_price: 8500000.00,
        warranty_expiry: '2026-11-25',
        last_maintenance_date: null,
        next_maintenance_date: null,
        ticketing_id: null,
        is_linked_to_ticketing: 0,
        qr_data: null,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'For mobile presentations and field work'
      }
    ];

    await queryInterface.bulkInsert('products', products, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  }
};
