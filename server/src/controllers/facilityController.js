const Facility = require('../models/Facility');

exports.getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.findByMember(req.userId);
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Server error fetching facilities' });
  }
};

exports.getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    // Check if user is owner or member
    if (facility.ownerId !== req.userId && !(facility.members || []).includes(req.userId)) {
      return res.status(403).json({ message: 'Access denied to this facility' });
    }
    res.json(facility);
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ message: 'Server error fetching facility' });
  }
};

exports.createFacility = async (req, res) => {
  try {
    // Use authenticated user as owner
    const ownerId = req.userId;
    const facilityData = { ...req.body };
    delete facilityData.ownerId; // Remove ownerId from body, use authenticated user
    delete facilityData.location; // Remove location from facility data
    const facility = await Facility.createFacility(facilityData, ownerId);
    res.status(201).json(facility);
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ message: 'Server error creating facility' });
  }
};

exports.updateFacility = async (req, res) => {
  try {
    const updatedFacility = await Facility.update(req.params.id, req.body);
    if (!updatedFacility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json(updatedFacility);
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ message: 'Server error updating facility' });
  }
};

exports.deleteFacility = async (req, res) => {
  try {
    const deleted = await Facility.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ message: 'Server error deleting facility' });
  }
};
