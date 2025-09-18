#!/usr/bin/env ruby

require 'xcodeproj'

project_path = ARGV[0] || '../ios/Sonarly.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main group
main_group = project.main_group.children.find { |g| g.name == 'Sonarly' }
unless main_group
  puts "Error: Could not find Sonarly group"
  exit 1
end

# Find the target
target = project.targets.find { |t| t.name == 'Sonarly' }
unless target
  puts "Error: Could not find Sonarly target"
  exit 1
end

# Files to add
files_to_add = [
  'VisionCameraPluginRegistry.mm',
  'PPGFrameProcessor.h'
]

# Add each file
files_to_add.each do |filename|
  file_path = File.join(File.dirname(project_path), 'Sonarly', filename)
  
  # Check if file already exists in project
  existing_ref = main_group.files.find { |f| f.path == filename }
  
  if existing_ref
    puts "File #{filename} already exists in project"
  else
    # Add file reference
    file_ref = main_group.new_file(filename)
    puts "Added file reference for #{filename}"
    
    # Add to build phase if it's a source file
    if filename.end_with?('.m', '.mm', '.swift')
      build_file = target.source_build_phase.add_file_reference(file_ref)
      puts "Added #{filename} to compile sources"
    end
  end
end

# Save the project
project.save
puts "Project saved successfully"