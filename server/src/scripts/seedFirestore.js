const { db } = require('../config/firebase-admin');
const Facility = require('../models/Facility');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Note = require('../models/Note');

async function seedFirestore() {
  try {
    console.log('Starting Firestore seeding...');

    // Create sample facilities
    console.log('Creating facilities...');
    const facility1 = await Facility.createFacility({
      name: 'Main Office',
      description: 'Headquarters facility',
      location: 'New York, NY',
      managerId: 'sample-manager-1'
    }, 'sample-owner-1');
    console.log('Created facility:', facility1.id);

    const facility2 = await Facility.createFacility({
      name: 'Branch Office',
      description: 'Regional branch office',
      location: 'Los Angeles, CA',
      managerId: 'sample-manager-2'
    }, 'sample-owner-2');
    console.log('Created facility:', facility2.id);

    // Create sample projects
    console.log('Creating projects...');
    const project1 = await Project.createProject({
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      facilityId: facility1.id,
      status: 'in_progress',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-01'),
      managerId: 'sample-manager-1'
    });
    console.log('Created project:', project1.id);

    const project2 = await Project.createProject({
      name: 'Mobile App Development',
      description: 'Native mobile application for iOS and Android',
      facilityId: facility2.id,
      status: 'planning',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-09-01'),
      managerId: 'sample-manager-2'
    });
    console.log('Created project:', project2.id);

    // Create sample tasks
    console.log('Creating tasks...');
    const task1 = await Task.createTask({
      title: 'Design Homepage Mockups',
      description: 'Create wireframes and mockups for the new homepage',
      projectId: project1.id,
      assignedTo: 'sample-user-1',
      status: 'completed',
      priority: 'high',
      dueDate: new Date('2024-02-15')
    });
    console.log('Created task:', task1.id);

    const task2 = await Task.createTask({
      title: 'Implement User Authentication',
      description: 'Set up login and registration system',
      projectId: project1.id,
      assignedTo: 'sample-user-2',
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date('2024-03-01')
    });
    console.log('Created task:', task2.id);

    const task3 = await Task.createTask({
      title: 'API Design',
      description: 'Design REST API endpoints for mobile app',
      projectId: project2.id,
      assignedTo: 'sample-user-3',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date('2024-04-01')
    });
    console.log('Created task:', task3.id);

    // Create sample notes
    console.log('Creating notes...');
    const note1 = await Note.createNote({
      title: 'Meeting Notes - Sprint Planning',
      content: 'Discussed upcoming sprint goals and priorities. Key points: improve performance, add new features, fix bugs.',
      facilityId: facility1.id,
      createdBy: 'sample-user-1',
      tags: ['meeting', 'sprint', 'planning']
    });
    console.log('Created note:', note1.id);

    const note2 = await Note.createNote({
      title: 'Technical Documentation',
      content: 'Updated API documentation with new endpoints and examples. Includes authentication flow and error handling.',
      facilityId: facility2.id,
      createdBy: 'sample-user-2',
      tags: ['documentation', 'api', 'technical']
    });
    console.log('Created note:', note2.id);

    console.log('Firestore seeding completed successfully!');
    console.log('Sample data created:');
    console.log('- 2 Facilities');
    console.log('- 2 Projects');
    console.log('- 3 Tasks');
    console.log('- 2 Notes');

  } catch (error) {
    console.error('Error seeding Firestore:', error);
  }
}

// Run the seed function
if (require.main === module) {
  seedFirestore().then(() => {
    console.log('Seeding process finished.');
    process.exit(0);
  }).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = seedFirestore;
