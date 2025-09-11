const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixTeamLeader() {
  try {
    console.log('🔍 Looking for team leaders that need to be fixed...');
    
    // Find all users who are team leaders
    const teamLeaders = await User.find({ 
      role: 'company_team_leader',
      isTeamLeader: true,
      teamId: { $exists: true, $ne: null }
    });
    
    console.log(`Found ${teamLeaders.length} team leaders to check`);
    
    for (const leader of teamLeaders) {
      console.log(`\n👤 Checking team leader: ${leader.firstName} ${leader.lastName} (${leader.email})`);
      console.log(`   User ID: ${leader._id}`);
      console.log(`   Team ID: ${leader.teamId}`);
      console.log(`   Company ID: ${leader.companyId}`);
      
      // Find the company
      const company = await Company.findById(leader.companyId);
      if (!company) {
        console.log(`   ❌ Company not found for user`);
        continue;
      }
      
      // Find the team
      const team = company.teams.id(leader.teamId);
      if (!team) {
        console.log(`   ❌ Team not found in company`);
        continue;
      }
      
      console.log(`   📋 Team: ${team.name}`);
      console.log(`   📋 Current team leader: ${team.teamLeader || 'None'}`);
      
      // Check if team leader is already set correctly
      if (team.teamLeader && team.teamLeader.equals(leader._id)) {
        console.log(`   ✅ Team leader is already set correctly`);
        continue;
      }
      
      // Fix the team leader assignment
      console.log(`   🔧 Fixing team leader assignment...`);
      team.teamLeader = leader._id;
      
      // Make sure the user is also a member of the team
      if (!team.members.includes(leader._id)) {
        console.log(`   🔧 Adding user to team members...`);
        team.members.push(leader._id);
      }
      
      await company.save();
      console.log(`   ✅ Team leader assignment fixed!`);
    }
    
    console.log('\n🎉 Team leader fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing team leaders:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixTeamLeader();
