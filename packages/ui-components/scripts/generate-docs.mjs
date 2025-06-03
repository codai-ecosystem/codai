/**
 * A simple script to generate component documentation for the UI component library
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const COMPONENTS_DIR = path.join(process.cwd(), 'src/components');
const OUTPUT_DIR = path.join(process.cwd(), 'docs');

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function findComponents() {
  const allFiles = await fs.readdir(COMPONENTS_DIR, { recursive: true });

  return allFiles
    .filter(file => file.endsWith('.tsx') && !file.endsWith('.test.tsx') && !file.endsWith('.stories.tsx'))
    .map(file => path.join(COMPONENTS_DIR, file));
}

async function extractComponentInfo(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  // Extract component name from file name or export declaration
  const fileName = path.basename(filePath, '.tsx');
  const exportMatch = content.match(/export\s+(?:const|function|class)\s+(\w+)/);
  const componentName = exportMatch ? exportMatch[1] : fileName;

  // Extract JSDoc comment if any
  const jsDocMatch = content.match(/\/\*\*\s*([\s\S]*?)\s*\*\//);
  const description = jsDocMatch ? jsDocMatch[1].replace(/\s*\*\s?/g, '\n').trim() : 'No description provided.';

  // Extract props interface or type
  const propsMatch = content.match(/(?:interface|type)\s+(\w+Props)\s*(?:extends\s+\w+\s*)?\{([\s\S]*?)}/);
  const propsName = propsMatch ? propsMatch[1] : 'Unknown';
  const propsDefinition = propsMatch ? propsMatch[2].trim() : 'No props defined.';

  return {
    name: componentName,
    path: relativePath,
    description,
    props: {
      name: propsName,
      definition: propsDefinition,
    },
  };
}

async function generateMarkdown(components) {
  let markdown = '# UI Components Library\n\n';
  markdown += 'This documentation is automatically generated from the component source files.\n\n';
  markdown += '## Components\n\n';

  for (const component of components) {
    markdown += `### ${component.name}\n\n`;
    markdown += `${component.description}\n\n`;
    markdown += `**Source:** \`${component.path}\`\n\n`;
    markdown += '**Props:**\n\n';
    markdown += '```typescript\n';
    markdown += `interface ${component.props.name} {\n${component.props.definition}\n}\n`;
    markdown += '```\n\n';
    markdown += '---\n\n';
  }

  return markdown;
}

async function main() {
  try {
    // Create output directory if it doesn't exist
    if (!(await exists(OUTPUT_DIR))) {
      await fs.mkdir(OUTPUT_DIR, { recursive: true });
    }

    // Find all component files
    const componentFiles = await findComponents();
    console.log(`Found ${componentFiles.length} components.`);

    // Extract information from each component
    const componentsInfo = await Promise.all(
      componentFiles.map(file => extractComponentInfo(file))
    );

    // Generate markdown
    const markdown = await generateMarkdown(componentsInfo);

    // Write documentation file
    const outputPath = path.join(OUTPUT_DIR, 'components.md');
    await fs.writeFile(outputPath, markdown, 'utf8');

    console.log(`Documentation generated at ${outputPath}`);
  } catch (error) {
    console.error('Error generating documentation:', error);
    process.exit(1);
  }
}

main();
