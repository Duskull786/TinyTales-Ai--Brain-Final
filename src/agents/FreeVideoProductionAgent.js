import { spawn } from 'child_process';
import { Logger } from '../utils/Logger.js';
import { VideoDatabase } from '../database/VideoDatabase.js';
import { google } from 'googleapis';
import ffmpeg from 'ffmpeg-static';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

export class FreeVideoProductionAgent {
  constructor() {
    this.logger = new Logger('FreeVideoAgent');
    this.videoDb = new VideoDatabase();
    this.youtube = null;
    this.isInitialized = false;

    // Production settings
    this.settings = {
      videoResolution: '1920x1080',
      frameRate: 30,
      audioBitrate: '128k',
      videoBitrate: '5000k',
      outputFormat: 'mp4'
    };

    // Free AI services endpoints
    this.stableDiffusionUrl = 'http://localhost:7860'; // Local Automatic1111
    this.ollamaUrl = 'http://localhost:11434';
  }

  async initialize() {
    this.logger.info('🎬 Initializing FREE Video Production Agent...');

    try {
      // Check if required free tools are available
      await this.checkFreeToolsAvailability();

      // Initialize YouTube upload (still free API)
      if (process.env.GOOGLE_CLIENT_ID) {
        await this.initializeYouTubeAPI();
      }

      await this.videoDb.connect();
      await this.ensureDirectories();

      this.isInitialized = true;
      this.logger.info('✅ FREE Video Production Agent ready!');

    } catch (error) {
      this.logger.error('❌ Failed to initialize FREE Video Production Agent:', error);
      throw error;
    }
  }

  async checkFreeToolsAvailability() {
    this.logger.info('🔍 Checking FREE AI tools availability...');

    // Check if FFmpeg is available
    try {
      await new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpeg, ['-version']);
        ffmpegProcess.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error('FFmpeg not available'));
        });
      });
      this.logger.info('✅ FFmpeg available');
    } catch {
      throw new Error('FFmpeg required but not available');
    }

    this.logger.info('✅ All FREE tools ready');
  }

  async initializeYouTubeAPI() {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    if (process.env.GOOGLE_REFRESH_TOKEN) {
      auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      this.youtube = google.youtube({
        version: 'v3',
        auth: auth
      });

      this.logger.info('✅ YouTube API initialized (FREE tier)');
    }
  }

  async ensureDirectories() {
    const dirs = [
      './output/videos',
      './output/audio',
      './output/images',
      './output/temp'
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  async createAnimatedVideo(script) {
    if (!this.isInitialized) {
      throw new Error('FREE Video Production Agent not initialized');
    }

    this.logger.info(`🎥 Creating FREE video for: "${script.title}"`);

    try {
      const videoId = `video_${Date.now()}`;
      const workDir = `./output/temp/${videoId}`;

      await fs.mkdir(workDir, { recursive: true });

      // Step 1: Generate FREE voiceover using Edge TTS
      this.logger.info('🎤 Generating FREE voiceover with Edge TTS...');
      const audioFile = await this.generateFreeVoiceover(script.content, workDir);

      // Step 2: Create scene images with FREE Stable Diffusion
      this.logger.info('🖼️ Creating FREE scene images with Stable Diffusion...');
      const sceneImages = await this.generateFreeSceneImages(script.content, workDir);

      // Step 3: Generate simple background music (FREE)
      this.logger.info('🎵 Adding FREE background music...');
      const musicFile = await this.generateFreeBackgroundMusic(script.theme, workDir);

      // Step 4: Compile video with FREE FFmpeg
      this.logger.info('🎬 Compiling video with FREE tools...');
      const finalVideo = await this.compileVideoFree({
        audioFile,
        sceneImages,
        musicFile,
        script,
        workDir,
        videoId
      });

      // Step 5: Create FREE thumbnail
      this.logger.info('🖼️ Creating FREE thumbnail...');
      const thumbnail = await this.generateFreeThumbnail(script, workDir);

      const videoData = {
        id: videoId,
        script: script,
        videoFile: finalVideo,
        thumbnail: thumbnail,
        duration: await this.getVideoDuration(finalVideo),
        createdAt: new Date(),
        status: 'ready_for_upload',
        source: 'free_tools'
      };

      // Save video metadata
      await this.videoDb.saveVideo(videoData);

      this.logger.info(`✅ FREE video production complete: ${videoData.id}`);
      return videoData;

    } catch (error) {
      this.logger.error('❌ FREE video production failed:', error);
      throw error;
    }
  }

  async generateFreeVoiceover(scriptContent, workDir) {
    try {
      // Extract narrative text
      const narrativeText = this.extractNarrativeText(scriptContent);

      // Use FREE Edge TTS (Microsoft's free text-to-speech)
      const audioFile = path.join(workDir, 'voiceover.wav');

      // Install edge-tts if not available: pip install edge-tts
      return new Promise((resolve, reject) => {
        const edgeTTSProcess = spawn('edge-tts', [
          '--voice', 'en-US-AriaNeural', // Child-friendly voice
          '--text', narrativeText,
          '--write-media', audioFile
        ]);

        edgeTTSProcess.on('close', (code) => {
          if (code === 0) {
            this.logger.info('✅ FREE voiceover generated with Edge TTS');
            resolve(audioFile);
          } else {
            // Fallback to espeak (also free)
            this.generateEspeakVoiceover(narrativeText, audioFile)
              .then(resolve)
              .catch(reject);
          }
        });

        edgeTTSProcess.on('error', () => {
          // Fallback to espeak
          this.generateEspeakVoiceover(narrativeText, audioFile)
            .then(resolve)
            .catch(reject);
        });
      });

    } catch (error) {
      this.logger.warn('⚠️ Using fallback espeak for voice generation');
      const narrativeText = this.extractNarrativeText(scriptContent);
      const audioFile = path.join(workDir, 'voiceover.wav');
      return await this.generateEspeakVoiceover(narrativeText, audioFile);
    }
  }

  async generateEspeakVoiceover(text, audioFile) {
    return new Promise((resolve, reject) => {
      // espeak is free and available on most systems
      const espeakProcess = spawn('espeak', [
        '-s', '150', // Speed
        '-p', '50',  // Pitch (higher for child-friendly)
        '-a', '200', // Amplitude
        '-w', audioFile,
        text.substring(0, 2000) // Limit length
      ]);

      espeakProcess.on('close', (code) => {
        if (code === 0) {
          resolve(audioFile);
        } else {
          reject(new Error('Voice generation failed'));
        }
      });
    });
  }

  async generateFreeSceneImages(scriptContent, workDir) {
    try {
      // Parse script into scenes
      const scenes = this.parseScenes(scriptContent);
      const imageFiles = [];

      for (let i = 0; i < Math.min(scenes.length, 6); i++) {
        const scene = scenes[i];
        this.logger.info(`🎨 Creating FREE image for scene ${i + 1}...`);

        // Try local Stable Diffusion first
        let imageFile;
        try {
          imageFile = await this.generateStableDiffusionImage(scene.description, workDir, i + 1);
        } catch {
          // Fallback to simple colored backgrounds with text
          imageFile = await this.generateSimpleSceneImage(scene.description, workDir, i + 1);
        }

        imageFiles.push({
          file: imageFile,
          description: scene.description,
          duration: scene.estimatedDuration || 5
        });
      }

      return imageFiles;

    } catch (error) {
      this.logger.error('❌ Failed to generate FREE scene images:', error);
      throw error;
    }
  }

  async generateStableDiffusionImage(description, workDir, sceneNum) {
    // If you have Automatic1111 running locally (FREE)
    try {
      const prompt = this.buildChildFriendlyPrompt(description);

      const response = await axios.post(`${this.stableDiffusionUrl}/sdapi/v1/txt2img`, {
        prompt: prompt,
        negative_prompt: "scary, dark, violent, adult, inappropriate",
        steps: 20,
        cfg_scale: 7,
        width: 1024,
        height: 576,
        sampler_index: "Euler a"
      });

      const imageData = response.data.images[0];
      const imageBuffer = Buffer.from(imageData, 'base64');
      const imageFile = path.join(workDir, `scene_${sceneNum}.png`);

      await fs.writeFile(imageFile, imageBuffer);
      return imageFile;

    } catch (error) {
      this.logger.warn('⚠️ Stable Diffusion not available, using simple images');
      throw error;
    }
  }

  async generateSimpleSceneImage(description, workDir, sceneNum) {
    // Create simple colored background with scene text using FFmpeg
    const imageFile = path.join(workDir, `scene_${sceneNum}.png`);
    const colors = ['#FFB6C1', '#87CEEB', '#98FB98', '#F0E68C', '#DDA0DD', '#F4A460'];
    const color = colors[sceneNum % colors.length];

    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpeg, [
        '-f', 'lavfi',
        '-i', `color=${color}:size=1920x1080:duration=1`,
        '-vf', `drawtext=text='${description.substring(0, 100).replace(/'/g, "'")}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`,
        '-frames:v', '1',
        '-y',
        imageFile
      ]);

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve(imageFile);
        } else {
          reject(new Error(`Simple image creation failed with code ${code}`));
        }
      });
    });
  }

  buildChildFriendlyPrompt(description) {
    return `children's book illustration, cartoon style, bright colors, friendly characters, ${description}, digital art, colorful, happy, safe for kids, Disney style, no text, high quality`;
  }

  parseScenes(scriptContent) {
    const lines = scriptContent.split('\n');
    const scenes = [];
    let currentScene = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.toLowerCase().includes('scene') ||
          trimmed.startsWith('SCENE')) {

        if (currentScene) {
          scenes.push(currentScene);
        }

        currentScene = {
          description: trimmed.replace(/scene \d+:?/i, '').trim(),
          estimatedDuration: 5
        };
      } else if (currentScene && trimmed &&
                 !trimmed.startsWith('NARRATION:') &&
                 !trimmed.startsWith('TITLE:')) {
        currentScene.description += ' ' + trimmed;
      }
    }

    if (currentScene) {
      scenes.push(currentScene);
    }

    return scenes.length > 0 ? scenes : [{
      description: 'A magical children\'s story scene with colorful characters',
      estimatedDuration: 10
    }];
  }

  extractNarrativeText(scriptContent) {
    const lines = scriptContent.split('\n');
    const narrative = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Extract narration lines
      if (trimmed.startsWith('NARRATION:')) {
        narrative.push(trimmed.replace('NARRATION:', '').trim());
      } else if (trimmed &&
                !trimmed.startsWith('SCENE') &&
                !trimmed.startsWith('[') &&
                !trimmed.startsWith('TITLE:') &&
                !trimmed === trimmed.toUpperCase()) {
        narrative.push(trimmed);
      }
    }

    return narrative.join(' ').substring(0, 3000);
  }

  async generateFreeBackgroundMusic(theme, workDir) {
    // Generate simple background tone using FFmpeg
    const musicFile = path.join(workDir, 'background_music.wav');

    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpeg, [
        '-f', 'lavfi',
        '-i', 'sine=frequency=220:duration=300',
        '-f', 'lavfi',
        '-i', 'sine=frequency=330:duration=300',
        '-filter_complex', '[0:0][1:0]amix=inputs=2:duration=longest:dropout_transition=3,volume=0.1',
        '-t', '300',
        '-y',
        musicFile
      ]);

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve(musicFile);
        } else {
          reject(new Error(`Music generation failed with code ${code}`));
        }
      });
    });
  }

  async compileVideoFree({ audioFile, sceneImages, musicFile, script, workDir, videoId }) {
    const outputFile = `./output/videos/${videoId}_${script.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

    return new Promise((resolve, reject) => {
      const inputs = ['-i', audioFile];

      // Add scene images
      sceneImages.forEach(scene => {
        inputs.push('-i', scene.file);
      });

      if (musicFile) {
        inputs.push('-i', musicFile);
      }

      // Create slideshow with crossfade
      let filterComplex = '';
      const imageCount = sceneImages.length;

      for (let i = 0; i < imageCount; i++) {
        filterComplex += `[${i + 1}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setpts=PTS-STARTPTS[img${i}];`;
      }

      filterComplex += sceneImages.map((_, i) => `[img${i}]`).join('') +
        `concat=n=${imageCount}:v=1:a=0[video];`;

      // Mix audio
      if (musicFile) {
        filterComplex += `[0:a][${imageCount + 1}:a]amix=inputs=2:duration=first:dropout_transition=3[audio]`;
      }

      const ffmpegArgs = [
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[video]',
        '-map', musicFile ? '[audio]' : '0:a',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:v', '3000k',
        '-b:a', '128k',
        '-r', '30',
        '-shortest',
        '-y',
        outputFile
      ];

      const ffmpegProcess = spawn(ffmpeg, ffmpegArgs);

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          this.logger.info(`✅ FREE video compiled: ${outputFile}`);
          resolve(outputFile);
        } else {
          reject(new Error(`Video compilation failed with code ${code}`));
        }
      });
    });
  }

  async generateFreeThumbnail(script, workDir) {
    const thumbnailFile = path.join(workDir, 'thumbnail.png');

    // Create simple but attractive thumbnail using FFmpeg
    return new Promise((resolve, reject) => {
      const title = script.title.substring(0, 40);

      const ffmpegProcess = spawn(ffmpeg, [
        '-f', 'lavfi',
        '-i', 'color=#4169E1:size=1280x720:duration=1',
        '-vf', `drawtext=text='${title}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:box=1:boxcolor=black@0.5:boxborderw=5`,
        '-frames:v', '1',
        '-y',
        thumbnailFile
      ]);

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve(thumbnailFile);
        } else {
          resolve(null); // Thumbnail is optional
        }
      });
    });
  }

  async getVideoDuration(videoFile) {
    return new Promise((resolve) => {
      const ffprobeProcess = spawn('ffprobe', [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        videoFile
      ]);

      let duration = '';
      ffprobeProcess.stdout.on('data', (data) => {
        duration += data.toString();
      });

      ffprobeProcess.on('close', () => {
        resolve(parseFloat(duration.trim()) || 0);
      });
    });
  }

  async uploadToYouTube(videoData) {
    if (!this.youtube) {
      this.logger.warn('⚠️ YouTube API not configured, skipping upload');
      return null;
    }

    try {
      this.logger.info(`📤 Uploading FREE video to YouTube: ${videoData.script.title}`);

      const videoFile = await fs.readFile(videoData.videoFile);

      const response = await this.youtube.videos.insert({
        part: 'id,snippet,status',
        requestBody: {
          snippet: {
            title: videoData.script.title,
            description: this.buildYouTubeDescription(videoData.script),
            tags: videoData.script.keywords,
            categoryId: '24',
            defaultLanguage: 'en'
          },
          status: {
            privacyStatus: 'public',
            madeForKids: true,
            selfDeclaredMadeForKids: true
          }
        },
        media: {
          body: videoFile
        }
      });

      const videoId = response.data.id;
      this.logger.info(`✅ FREE video uploaded: https://youtube.com/watch?v=${videoId}`);

      await this.videoDb.updateVideoStatus(videoData.id, 'published', {
        youtubeId: videoId,
        publishedAt: new Date()
      });

      return {
        youtubeId: videoId,
        url: `https://youtube.com/watch?v=${videoId}`
      };

    } catch (error) {
      this.logger.error('❌ Failed to upload FREE video:', error);
      throw error;
    }
  }

  buildYouTubeDescription(script) {
    return `${script.description}

🌟 Welcome to TinyTales! 🌟

A magical ${script.theme} story created with FREE AI tools! Perfect for kids aged ${script.targetAge}.

✨ Created with: Ollama AI, Stable Diffusion, Edge TTS, FFmpeg
📚 Theme: ${script.theme}
🎯 Story type: ${script.storyType}

👍 Like this video if you enjoyed it!
🔔 Subscribe for new stories every day!
💬 Tell us what story you'd like to see next!

#TinyTales #KidsStories #FreeAI #${script.theme.replace(' ', '')} #ChildrensContent

---
TinyTales: Magical stories created with free AI tools for children everywhere! ✨`;
  }

  async getHealthStatus() {
    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      lastVideoCreated: await this.videoDb.getLastVideoTime(),
      totalVideos: await this.videoDb.getVideoCount(),
      source: 'free_tools',
      toolsAvailable: {
        ffmpeg: true,
        edgeTTS: await this.checkToolAvailable('edge-tts'),
        espeak: await this.checkToolAvailable('espeak')
      }
    };
  }

  async checkToolAvailable(tool) {
    try {
      await new Promise((resolve, reject) => {
        const process = spawn(tool, ['--version']);
        process.on('close', (code) => {
          if (code === 0) resolve();
          else reject();
        });
        process.on('error', reject);
      });
      return true;
    } catch {
      return false;
    }
  }

  async shutdown() {
    this.logger.info('⏹️ Shutting down FREE Video Production Agent...');

    if (this.videoDb) {
      await this.videoDb.disconnect();
    }

    this.isInitialized = false;
    this.logger.info('✅ FREE Video Production Agent shutdown complete');
  }
}