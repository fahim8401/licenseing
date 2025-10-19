import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * GET /v1/installer/download
 * Serve the installer script
 */
router.get('/download', async (req: Request, res: Response) => {
  try {
    // Try multiple possible locations for the installer
    const possiblePaths = [
      path.join(__dirname, '../../installer/install.sh'),
      path.join(__dirname, '../../../installer/install.sh'),
      path.join(__dirname, '../../../../installer/install.sh'),
      path.join(process.cwd(), 'installer/install.sh'),
      path.join(process.cwd(), '../installer/install.sh'),
    ];
    
    let installerPath: string | null = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        installerPath = testPath;
        break;
      }
    }
    
    if (!installerPath) {
      return res.status(404).json({ 
        error: 'Installer script not found' 
      });
    }
    
    // Read the installer script
    const installerContent = fs.readFileSync(installerPath, 'utf8');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'inline; filename="install.sh"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Send the installer script
    res.send(installerContent);
  } catch (error) {
    console.error('Error serving installer:', error);
    res.status(500).json({ 
      error: 'Failed to serve installer script' 
    });
  }
});

/**
 * GET /install
 * Serve the installer script (convenience endpoint)
 */
router.get('/install', async (req: Request, res: Response) => {
  try {
    // Try multiple possible locations for the installer
    const possiblePaths = [
      path.join(__dirname, '../../installer/install.sh'),
      path.join(__dirname, '../../../installer/install.sh'),
      path.join(__dirname, '../../../../installer/install.sh'),
      path.join(process.cwd(), 'installer/install.sh'),
      path.join(process.cwd(), '../installer/install.sh'),
    ];
    
    let installerPath: string | null = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        installerPath = testPath;
        break;
      }
    }
    
    if (!installerPath) {
      return res.status(404).send('#!/bin/bash\necho "Installer not found"\nexit 1\n');
    }
    
    // Read the installer script
    const installerContent = fs.readFileSync(installerPath, 'utf8');
    
    // Set appropriate headers for bash execution
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Send the installer script
    res.send(installerContent);
  } catch (error) {
    console.error('Error serving installer:', error);
    res.status(500).send('#!/bin/bash\necho "Error serving installer"\nexit 1\n');
  }
});

export default router;
