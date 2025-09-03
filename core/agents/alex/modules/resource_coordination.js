const fs = require('fs').promises;
const path = require('path');

/**
 * Resource Coordination Module for PM Agent (Alex - Alexander)
 *
 * Manages resource allocation, capacity planning, and coordination across projects.
 * Like Alexander's masterful logistics in managing armies across vast territories,
 * effective resource coordination ensures the right people are in the right place at the right time.
 */
class ResourceCoordination {
  constructor(agent) {
    this.agent = agent;
    this.resourcesPath = path.join(process.cwd(), 'data', 'pm_agent', 'resources.json');
    this.allocationsPath = path.join(process.cwd(), 'data', 'pm_agent', 'resource_allocations.json');

    // Resource coordination state
    this.resources = new Map();
    this.allocations = new Map();
    this.resourceTypes = [
      'human_resource',
      'technical_resource',
      'infrastructure',
      'budget',
      'equipment',
      'software_license'
    ];

    this.skillCategories = [
      'development',
      'design',
      'project_management',
      'quality_assurance',
      'devops',
      'business_analysis',
      'architecture'
    ];
  }

  /**
   * Initialize the resource coordination module
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.resourcesPath), { recursive: true });

      // Load existing resources
      await this.loadResources();

      // Load resource allocations
      await this.loadAllocations();

      // Initialize sample resources if none exist
      if (this.resources.size === 0) {
        await this.initializeSampleResources();
      }

      console.log(`🔧 Resource Coordination module initialized with ${this.resources.size} resources`);

    } catch (error) {
      console.error('❌ Failed to initialize Resource Coordination module:', error.message);
      throw error;
    }
  }

  /**
   * Load existing resources from storage
   */
  async loadResources() {
    try {
      const data = await fs.readFile(this.resourcesPath, 'utf8');
      const resources = JSON.parse(data);

      resources.forEach(resource => {
        this.resources.set(resource.id, resource);
      });

      console.log(`📚 Loaded ${this.resources.size} existing resources`);

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading resources:', error.message);
      }
      // Create empty resources file
      await this.saveResources();
    }
  }

  /**
   * Load resource allocations
   */
  async loadAllocations() {
    try {
      const data = await fs.readFile(this.allocationsPath, 'utf8');
      const allocations = JSON.parse(data);

      allocations.forEach(allocation => {
        this.allocations.set(allocation.id, allocation);
      });

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading allocations:', error.message);
      }
      this.allocations = new Map();
      await this.saveAllocations();
    }
  }

  /**
   * Save resources to storage
   */
  async saveResources() {
    try {
      const resources = Array.from(this.resources.values());
      await fs.writeFile(this.resourcesPath, JSON.stringify(resources, null, 2));
    } catch (error) {
      console.error('❌ Error saving resources:', error.message);
      throw error;
    }
  }

  /**
   * Save allocations to storage
   */
  async saveAllocations() {
    try {
      const allocations = Array.from(this.allocations.values());
      await fs.writeFile(this.allocationsPath, JSON.stringify(allocations, null, 2));
    } catch (error) {
      console.error('❌ Error saving allocations:', error.message);
      throw error;
    }
  }

  /**
   * Initialize sample resources
   */
  async initializeSampleResources() {
    const sampleResources = [
      {
        id: 'dev-001',
        name: 'Senior Frontend Developer',
        type: 'human_resource',
        skills: ['React', 'TypeScript', 'CSS', 'JavaScript'],
        capacity: 40, // hours per week
        availability: 'available',
        cost_per_hour: 75,
        location: 'Remote',
        experience_level: 'senior'
      },
      {
        id: 'dev-002',
        name: 'Backend Developer',
        type: 'human_resource',
        skills: ['Node.js', 'Python', 'PostgreSQL', 'AWS'],
        capacity: 40,
        availability: 'available',
        cost_per_hour: 70,
        location: 'Remote',
        experience_level: 'mid'
      },
      {
        id: 'designer-001',
        name: 'UX/UI Designer',
        type: 'human_resource',
        skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
        capacity: 40,
        availability: 'available',
        cost_per_hour: 65,
        location: 'Remote',
        experience_level: 'senior'
      },
      {
        id: 'qa-001',
        name: 'QA Engineer',
        type: 'human_resource',
        skills: ['Test Automation', 'Selenium', 'Jest', 'Manual Testing'],
        capacity: 40,
        availability: 'available',
        cost_per_hour: 60,
        location: 'Remote',
        experience_level: 'mid'
      },
      {
        id: 'infra-001',
        name: 'AWS Cloud Infrastructure',
        type: 'infrastructure',
        description: 'Production-ready AWS environment',
        capacity: 'unlimited',
        availability: 'available',
        cost_per_month: 500,
        specifications: ['EC2', 'RDS', 'S3', 'CloudFront']
      }
    ];

    for (const resource of sampleResources) {
      resource.created_date = new Date().toISOString();
      resource.current_utilization = 0;
      resource.allocations = [];
      this.resources.set(resource.id, resource);
    }

    await this.saveResources();
    console.log('🔧 Sample resources initialized');
  }

  /**
   * Coordinate resources for project requirements
   */
  async coordinateResources(resourceRequirements, timeline) {
    try {
      console.log(`🔧 Coordinating resources for ${resourceRequirements.length} requirements`);

      const coordination = {
        id: `coordination-${Date.now()}`,
        created: new Date().toISOString(),
        requirements: resourceRequirements,
        timeline: timeline,
        allocations: [],
        conflicts: [],
        recommendations: [],
        total_cost: 0,
        feasibility: 'unknown'
      };

      // Process each resource requirement
      for (const requirement of resourceRequirements) {
        const allocation = await this.allocateResource(requirement, timeline);

        if (allocation.success) {
          coordination.allocations.push(allocation);
          coordination.total_cost += allocation.estimated_cost || 0;
        } else {
          coordination.conflicts.push({
            requirement: requirement,
            issue: allocation.issue,
            alternatives: allocation.alternatives || []
          });
        }
      }

      // Assess overall feasibility
      coordination.feasibility = this.assessCoordinationFeasibility(coordination);

      // Generate recommendations
      coordination.recommendations = this.generateResourceRecommendations(coordination);

      // Save coordination record
      const coordinationId = coordination.id;
      // Store in allocations for tracking
      this.allocations.set(coordinationId, coordination);
      await this.saveAllocations();

      console.log(`✅ Resource coordination completed: ${coordination.allocations.length} allocations, ${coordination.conflicts.length} conflicts`);

      return {
        coordination_id: coordinationId,
        successful_allocations: coordination.allocations.length,
        conflicts: coordination.conflicts.length,
        total_estimated_cost: coordination.total_cost,
        feasibility: coordination.feasibility,
        recommendations: coordination.recommendations,
        detailed_plan: coordination
      };

    } catch (error) {
      console.error('❌ Failed to coordinate resources:', error.message);
      throw error;
    }
  }

  /**
   * Allocate a specific resource
   */
  async allocateResource(requirement, timeline) {
    try {
      // Find suitable resources
      const suitableResources = this.findSuitableResources(requirement);

      if (suitableResources.length === 0) {
        return {
          success: false,
          issue: 'No suitable resources found',
          requirement: requirement,
          alternatives: this.suggestAlternatives(requirement)
        };
      }

      // Select best resource based on availability and fit
      const selectedResource = this.selectBestResource(suitableResources, requirement, timeline);

      if (!selectedResource) {
        return {
          success: false,
          issue: 'No available resources match timeline',
          requirement: requirement,
          alternatives: suitableResources.slice(0, 3)
        };
      }

      // Create allocation
      const allocation = {
        id: `allocation-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        resource_id: selectedResource.id,
        resource_name: selectedResource.name,
        requirement: requirement,
        timeline: timeline,
        allocation_percentage: requirement.allocation_percentage || 100,
        start_date: timeline.start_date || new Date().toISOString(),
        end_date: timeline.end_date || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        status: 'allocated',
        created: new Date().toISOString(),
        estimated_cost: this.calculateAllocationCost(selectedResource, requirement, timeline)
      };

      // Update resource utilization
      selectedResource.current_utilization += (requirement.allocation_percentage || 100);
      selectedResource.allocations.push(allocation.id);

      await this.saveResources();

      return {
        success: true,
        allocation: allocation,
        resource: selectedResource
      };

    } catch (error) {
      console.error('❌ Failed to allocate resource:', error.message);
      return {
        success: false,
        issue: error.message,
        requirement: requirement
      };
    }
  }

  /**
   * Find suitable resources for a requirement
   */
  findSuitableResources(requirement) {
    const resources = Array.from(this.resources.values());

    return resources.filter(resource => {
      // Check resource type match
      if (requirement.type && resource.type !== requirement.type) {
        return false;
      }

      // Check skill requirements
      if (requirement.skills && requirement.skills.length > 0) {
        const hasRequiredSkills = requirement.skills.every(skill =>
          resource.skills && resource.skills.some(resourceSkill =>
            resourceSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(resourceSkill.toLowerCase())
          )
        );
        if (!hasRequiredSkills) return false;
      }

      // Check availability
      if (resource.availability !== 'available') {
        return false;
      }

      // Check capacity
      const requiredCapacity = requirement.allocation_percentage || 100;
      const availableCapacity = 100 - (resource.current_utilization || 0);
      if (requiredCapacity > availableCapacity) {
        return false;
      }

      return true;
    });
  }

  /**
   * Select the best resource from suitable options
   */
  selectBestResource(suitableResources, requirement, timeline) {
    if (suitableResources.length === 0) return null;

    // Score resources based on various factors
    const scoredResources = suitableResources.map(resource => {
      let score = 0;

      // Skill match score
      if (requirement.skills) {
        const skillMatches = requirement.skills.filter(skill =>
          resource.skills && resource.skills.some(resourceSkill =>
            resourceSkill.toLowerCase().includes(skill.toLowerCase())
          )
        ).length;
        score += (skillMatches / requirement.skills.length) * 40;
      }

      // Experience level score
      const experienceScore = {
        'junior': 10,
        'mid': 20,
        'senior': 30,
        'lead': 35
      };
      score += experienceScore[resource.experience_level] || 15;

      // Availability score (lower utilization is better)
      const utilizationScore = Math.max(0, 30 - (resource.current_utilization || 0));
      score += utilizationScore;

      // Cost efficiency score (if budget is a concern)
      if (requirement.budget_constraint) {
        const costScore = Math.max(0, 20 - ((resource.cost_per_hour || 50) / 10));
        score += costScore;
      }

      return { resource, score };
    });

    // Sort by score and return the best match
    scoredResources.sort((a, b) => b.score - a.score);
    return scoredResources[0].resource;
  }

  /**
   * Calculate allocation cost
   */
  calculateAllocationCost(resource, requirement, timeline) {
    if (resource.type === 'human_resource') {
      const startDate = new Date(timeline.start_date || Date.now());
      const endDate = new Date(timeline.end_date || Date.now() + (30 * 24 * 60 * 60 * 1000));
      const weeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
      const hoursPerWeek = (resource.capacity || 40) * ((requirement.allocation_percentage || 100) / 100);
      const totalHours = weeks * hoursPerWeek;
      return totalHours * (resource.cost_per_hour || 0);
    } else if (resource.cost_per_month) {
      const startDate = new Date(timeline.start_date || Date.now());
      const endDate = new Date(timeline.end_date || Date.now() + (30 * 24 * 60 * 60 * 1000));
      const months = Math.ceil((endDate - startDate) / (30 * 24 * 60 * 60 * 1000));
      return months * resource.cost_per_month;
    }

    return 0;
  }

  /**
   * Assess coordination feasibility
   */
  assessCoordinationFeasibility(coordination) {
    const totalRequirements = coordination.requirements.length;
    const successfulAllocations = coordination.allocations.length;
    const conflicts = coordination.conflicts.length;

    const successRate = (successfulAllocations / totalRequirements) * 100;

    if (successRate >= 90) return 'high';
    if (successRate >= 70) return 'medium';
    if (successRate >= 50) return 'low';
    return 'critical';
  }

  /**
   * Generate resource recommendations
   */
  generateResourceRecommendations(coordination) {
    const recommendations = [];

    // Recommendations for conflicts
    coordination.conflicts.forEach(conflict => {
      if (conflict.alternatives && conflict.alternatives.length > 0) {
        recommendations.push({
          type: 'alternative_resource',
          priority: 'high',
          description: `Consider alternative resources for ${conflict.requirement.role || conflict.requirement.type}`,
          alternatives: conflict.alternatives.slice(0, 2)
        });
      } else {
        recommendations.push({
          type: 'resource_acquisition',
          priority: 'high',
          description: `Need to acquire new resource: ${conflict.requirement.role || conflict.requirement.type}`,
          suggested_action: 'Hire or contract additional resources'
        });
      }
    });

    // Cost optimization recommendations
    if (coordination.total_cost > 50000) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'medium',
        description: 'High resource costs detected',
        suggested_action: 'Review resource allocation efficiency and consider cost-effective alternatives'
      });
    }

    // Utilization recommendations
    const overUtilizedResources = Array.from(this.resources.values())
      .filter(r => (r.current_utilization || 0) > 90);

    if (overUtilizedResources.length > 0) {
      recommendations.push({
        type: 'utilization_warning',
        priority: 'medium',
        description: `${overUtilizedResources.length} resources are over-utilized`,
        suggested_action: 'Consider load balancing or additional resource acquisition'
      });
    }

    return recommendations;
  }

  /**
   * Suggest alternatives for unmet requirements
   */
  suggestAlternatives(requirement) {
    const alternatives = [];

    // Suggest similar resources with partial skill match
    const partialMatches = Array.from(this.resources.values()).filter(resource => {
      if (requirement.skills && resource.skills) {
        const commonSkills = requirement.skills.filter(skill =>
          resource.skills.some(resourceSkill =>
            resourceSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        return commonSkills.length > 0 && commonSkills.length < requirement.skills.length;
      }
      return false;
    });

    alternatives.push(...partialMatches.slice(0, 2));

    // Suggest training existing resources
    if (alternatives.length < 2) {
      alternatives.push({
        type: 'training_option',
        description: 'Train existing team members in required skills',
        estimated_time: '2-4 weeks',
        estimated_cost: 2000
      });
    }

    return alternatives;
  }

  /**
   * Get resource health metrics
   */
  async getResourceHealth(projectId) {
    try {
      const projectAllocations = Array.from(this.allocations.values())
        .filter(a => !projectId || a.project_id === projectId);

      const health = {
        score: 0,
        status: 'healthy',
        issues: [],
        metrics: {}
      };

      // Calculate utilization metrics
      const resources = Array.from(this.resources.values());
      const totalResources = resources.length;
      const overUtilized = resources.filter(r => (r.current_utilization || 0) > 90).length;
      const underUtilized = resources.filter(r => (r.current_utilization || 0) < 50).length;
      const avgUtilization = resources.reduce((sum, r) => sum + (r.current_utilization || 0), 0) / totalResources;

      // Calculate health score
      let score = 100;
      score -= (overUtilized / totalResources) * 30; // Penalize over-utilization
      score -= Math.max(0, (underUtilized / totalResources) * 10); // Slight penalty for under-utilization

      health.score = Math.max(0, Math.round(score));
      health.metrics = {
        total_resources: totalResources,
        average_utilization: Math.round(avgUtilization),
        over_utilized: overUtilized,
        under_utilized: underUtilized,
        utilization_percentage: Math.round(avgUtilization)
      };

      // Determine status
      if (health.score >= 80) health.status = 'healthy';
      else if (health.score >= 60) health.status = 'at_risk';
      else health.status = 'critical';

      // Add issues
      if (overUtilized > 0) {
        health.issues.push(`${overUtilized} resources are over-utilized`);
      }
      if (avgUtilization < 60) {
        health.issues.push('Overall resource utilization is low');
      }

      return health;

    } catch (error) {
      console.error('❌ Failed to get resource health:', error.message);
      return { score: 0, status: 'error', issues: [error.message] };
    }
  }

  /**
   * Get resource status summary
   */
  async getResourceStatus() {
    const resources = Array.from(this.resources.values());
    const allocations = Array.from(this.allocations.values());

    // Calculate utilization distribution
    const utilizationRanges = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-90%': 0,
      '91-100%': 0,
      'Over 100%': 0
    };

    resources.forEach(resource => {
      const utilization = resource.current_utilization || 0;
      if (utilization <= 25) utilizationRanges['0-25%']++;
      else if (utilization <= 50) utilizationRanges['26-50%']++;
      else if (utilization <= 75) utilizationRanges['51-75%']++;
      else if (utilization <= 90) utilizationRanges['76-90%']++;
      else if (utilization <= 100) utilizationRanges['91-100%']++;
      else utilizationRanges['Over 100%']++;
    });

    // Calculate total costs
    const totalMonthlyCost = resources.reduce((sum, resource) => {
      if (resource.type === 'human_resource') {
        const monthlyHours = (resource.capacity || 40) * 4.33; // Average weeks per month
        return sum + (monthlyHours * (resource.cost_per_hour || 0));
      } else if (resource.cost_per_month) {
        return sum + resource.cost_per_month;
      }
      return sum;
    }, 0);

    return {
      total_resources: resources.length,
      by_type: this.groupResourcesByType(resources),
      utilization_distribution: utilizationRanges,
      utilization_percentage: this.calculateAverageUtilization(resources),
      total_monthly_cost: Math.round(totalMonthlyCost),
      active_allocations: allocations.filter(a => a.status === 'allocated').length,
      health_score: (await this.getResourceHealth()).score,
      velocity: this.calculateResourceVelocity(resources, allocations)
    };
  }

  /**
   * Helper methods
   */
  groupResourcesByType(resources) {
    return resources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1;
      return acc;
    }, {});
  }

  calculateAverageUtilization(resources) {
    if (resources.length === 0) return 0;
    const totalUtilization = resources.reduce((sum, r) => sum + (r.current_utilization || 0), 0);
    return Math.round(totalUtilization / resources.length);
  }

  calculateResourceVelocity(resources, allocations) {
    // Simple velocity calculation based on recent allocations
    const recentAllocations = allocations.filter(a => {
      const created = new Date(a.created);
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      return created >= thirtyDaysAgo;
    });

    return {
      allocations_per_month: recentAllocations.length,
      average_allocation_time: '2-3 days', // Placeholder
      success_rate: Math.round((recentAllocations.filter(a => a.status === 'allocated').length / Math.max(1, recentAllocations.length)) * 100)
    };
  }
}

module.exports = ResourceCoordination;
