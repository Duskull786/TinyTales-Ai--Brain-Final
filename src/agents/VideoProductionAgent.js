import { OpenAI } from 'openai';
import axios from 'axios';
import { Logger } from '../utils/Logger.js';
import { VideoDatabase } from '../database/VideoDatabase.js';
import { google } from 'googleapis';
import ffmpeg from 'ffmpeg-static';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class VideoProductionAgent {
  constructor() {
    this.logger = new Logger('VideoAgent');
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.videoDb = new VideoDatabase();
    this.youtube = null;
    this.isInitialized = false;

    // Production settings
    this.settings = {
      videoResolution: '1920x1080',
      frameRate: 30,
      audioBitrate: '128k',
      videoBitrate: '5000k',
      outputFormat: 'mp4',
      maxDuration: 600 // 10 minutes max
    };

    // AI service endpoints
    this.services = {
      elevenLabs: 'https://api.elevenlabs.io/v1',
      runway: 'https://api.runwayml.com/v1',
      midjourney: process.env.MIDJOURNEY_API_KEY ? 'https://api.midjourney.com/v1' : null
    };
  }

  async initialize() {
    this.logger.info('🎬 Initializing Video Production Agent...');

    try {
      // Initialize YouTube upload capabilities
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      this.youtube = google.youtube({
        version: 'v3',
        auth: auth
      });

      await this.videoDb.connect();

      // Ensure output directories exist
      await this.ensureDirectories();

      this.isInitialized = true;
      this.logger.info('✅ Video Production Agent ready for automated video creation');

    } catch (error) {
      this.logger.error('❌ Failed to initialize Video Production Agent:', error);
      throw error;
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
      throw new Error('Video Production Agent not initialized');
    }

    this.logger.info(`🎥 Starting video production for: "${script.title}"`);

    try {
      const videoId = `video_${Date.now()}`;
      const workDir = `./output/temp/${videoId}`;

      await fs.mkdir(workDir, { recursive: true });

      // Step 1: Generate voiceover
      this.logger.info('🎤 Generating voiceover...');
      const audioFile = await this.generateVoiceover(script.content, workDir);

      // Step 2: Create visual scenes
      this.logger.info('🖼️ Creating visual scenes...');
      const sceneImages = await this.generateSceneImages(script.content, workDir);

      // Step 3: Generate background music
      this.logger.info('🎵 Adding background music...');
      const musicFile = await this.generateBackgroundMusic(script.theme, workDir);

      // Step 4: Compile video
      this.logger.info('🎬 Compiling final video...');
      const finalVideo = await this.compileVideo({
        audioFile,
        sceneImages,
        musicFile,
        script,
        workDir,
        videoId
      });

      // Step 5: Generate thumbnail
      this.logger.info('🖼️ Creating thumbnail...');
      const thumbnail = await this.generateThumbnail(script, workDir);

      const videoData = {
        id: videoId,
        script: script,
        videoFile: finalVideo,
        thumbnail: thumbnail,
        duration: await this.getVideoDuration(finalVideo),
        createdAt: new Date(),
        status: 'ready_for_upload'
      };

      // Save video metadata
      await this.videoDb.saveVideo(videoData);

      this.logger.info(`✅ Video production complete: ${videoData.id}`);
      return videoData;

    } catch (error) {
      this.logger.error('❌ Video production failed:', error);
      throw error;
    }
  }

  async generateVoiceover(scriptContent, workDir) {
    try {
      // Extract narrative text from script (remove stage directions)
      const narrativeText = this.extractNarrativeText(scriptContent);

      // Use ElevenLabs for high-quality voice synthesis
      const response = await axios.post(`${this.services.elevenLabs}/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
        text: narrativeText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      }, {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      });

      const audioFile = path.join(workDir, 'voiceover.mp3');
      const writer = (await import('fs')).createWriteStream(audioFile);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(audioFile));
        writer.on('error', reject);
      });

    } catch (error) {
      this.logger.warn('⚠️ ElevenLabs failed, using OpenAI TTS fallback');

      // Fallback to OpenAI TTS
      const narrativeText = this.extractNarrativeText(scriptContent);
      const response = await this.openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "nova", // Child-friendly voice
        input: narrativeText,
        speed: 0.9
      });

      const audioFile = path.join(workDir, 'voiceover.mp3');
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(audioFile, buffer);

      return audioFile;
    }
  }

  extractNarrativeText(scriptContent) {
    // Remove stage directions and extract only spoken narrative
    const lines = scriptContent.split('\n');
    const narrative = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip stage directions (typically in brackets or all caps)
      if (trimmed.startsWith('[') || trimmed.startsWith('(') ||
          trimmed === trimmed.toUpperCase() ||
          trimmed.startsWith('SCENE') ||
          trimmed.startsWith('CHARACTER')) {
        continue;
      }

      // Include dialogue and narrative
      if (trimmed && !trimmed.startsWith('//')) {
        narrative.push(trimmed);
      }
    }

    return narrative.join(' ').substring(0, 4000); // Limit for TTS
  }

  async generateSceneImages(scriptContent, workDir) {
    try {
      // Parse script into scenes
      const scenes = this.parseScenes(scriptContent);
      const imageFiles = [];

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        this.logger.info(`🎨 Creating image for scene ${i + 1}: ${scene.description.substring(0, 50)}...`);

        // Generate image using DALL-E 3
        const imagePrompt = this.buildImagePrompt(scene.description);

        const response = await this.openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          size: "1792x1024",
          quality: "hd",
          style: "vivid",
          n: 1,
        });

        // Download and save image
        const imageUrl = response.data[0].url;
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });

        const imageFile = path.join(workDir, `scene_${i + 1}.png`);
        const writer = (await import('fs')).createWriteStream(imageFile);

        imageResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        imageFiles.push({
          file: imageFile,
          description: scene.description,
          duration: scene.estimatedDuration || 5
        });
      }

      return imageFiles;

    } catch (error) {
      this.logger.error('❌ Failed to generate scene images:', error);
      throw error;
    }
  }

  parseScenes(scriptContent) {
    const lines = scriptContent.split('\n');
    const scenes = [];
    let currentScene = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.toLowerCase().includes('scene') ||
          trimmed.startsWith('[') ||
          trimmed.includes('we see') ||
          trimmed.includes('shows')) {

        if (currentScene) {
          scenes.push(currentScene);
        }

        currentScene = {
          description: trimmed,
          estimatedDuration: 5 // Default 5 seconds per scene
        };
      } else if (currentScene && trimmed) {
        currentScene.description += ' ' + trimmed;
      }
    }

    if (currentScene) {
      scenes.push(currentScene);
    }

    return scenes.length > 0 ? scenes : [{
      description: scriptContent.substring(0, 500),
      estimatedDuration: 10
    }];
  }

  buildImagePrompt(sceneDescription) {
    return `Create a beautiful, colorful illustration for a children's story in a warm, friendly animation style.
${sceneDescription}

Style: Disney/Pixar-like 3D animation, bright and cheerful colors, child-friendly characters with big expressive eyes, magical and whimsical atmosphere.
Quality: High detail, professional animation quality, perfect for kids aged 3-8.
Avoid: Dark themes, scary elements, realistic violence, adult content.`;
  }

  async generateBackgroundMusic(theme, workDir) {
    // For now, use a placeholder - in production, integrate with AI music generation
    // services like Mubert, AIVA, or Soundful
    this.logger.info(`🎵 Adding background music for theme: ${theme}`);

    // Create a silent audio track for now - replace with actual music generation
    const musicFile = path.join(workDir, 'background_music.mp3');

    // Generate simple background music using ffmpeg tone generator
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpeg, [
        '-f', 'lavfi',
        '-i', `sine=frequency=220:duration=60,sine=frequency=330:duration=60`,
        '-filter_complex', '[0:0][1:0]amix=inputs=2:duration=longest:dropout_transition=3',
        '-t', '300', // 5 minutes max
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

  async compileVideo({ audioFile, sceneImages, musicFile, script, workDir, videoId }) {
    const outputFile = `./output/videos/${videoId}_${script.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

    return new Promise((resolve, reject) => {
      // Create video from images with crossfade transitions
      const inputs = ['-i', audioFile];

      // Add each scene image
      sceneImages.forEach(scene => {
        inputs.push('-i', scene.file);
      });

      if (musicFile) {
        inputs.push('-i', musicFile);
      }

      // Create filter complex for slideshow with transitions
      let filterComplex = '';
      const imageCount = sceneImages.length;

      for (let i = 0; i < imageCount; i++) {
        const duration = sceneImages[i].duration;
        filterComplex += `[${i + 1}:v]scale=${this.settings.videoResolution}:force_original_aspect_ratio=decrease:eval=frame,pad=${this.settings.videoResolution}:(ow-iw)/2:(oh-ih)/2:color=black,setpts=PTS-STARTPTS,settb=AVTB[img${i}];`;
      }

      // Create slideshow
      filterComplex += sceneImages.map((_, i) => `[img${i}]`).join('') +
        `concat=n=${imageCount}:v=1:a=0[video];`;

      // Mix audio if we have background music
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
        '-b:v', this.settings.videoBitrate,
        '-b:a', this.settings.audioBitrate,
        '-r', this.settings.frameRate,
        '-shortest',
        '-y',
        outputFile
      ];

      const ffmpegProcess = spawn(ffmpeg, ffmpegArgs);

      ffmpegProcess.stderr.on('data', (data) => {
        this.logger.debug(`FFmpeg: ${data}`);
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          this.logger.info(`✅ Video compiled successfully: ${outputFile}`);
          resolve(outputFile);
        } else {
          reject(new Error(`Video compilation failed with code ${code}`));
        }
      });
    });
  }

  async generateThumbnail(script, workDir) {
    try {
      const thumbnailPrompt = `Create an eye-catching YouTube thumbnail for a kids' video titled "${script.title}".

Theme: ${script.theme}
Description: ${script.description}

Style requirements:
- Bright, colorful, and appealing to children and parents
- Large, readable text overlay with the title
- Cartoon/animated style characters
- Express excitement and fun
- High contrast and vibrant colors
- YouTube thumbnail best practices (1280x720)
- Child-safe and appropriate content

Make it irresistible for kids to click while being parent-approved!`;

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: thumbnailPrompt,
        size: "1792x1024", // Close to 16:9 aspect ratio
        quality: "hd",
        style: "vivid",
        n: 1,
      });

      const thumbnailUrl = response.data[0].url;
      const thumbnailResponse = await axios.get(thumbnailUrl, { responseType: 'stream' });

      const thumbnailFile = path.join(workDir, 'thumbnail.png');
      const writer = (await import('fs')).createWriteStream(thumbnailFile);

      thumbnailResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return thumbnailFile;

    } catch (error) {
      this.logger.error('❌ Failed to generate thumbnail:', error);
      return null;
    }
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
    try {
      this.logger.info(`📤 Uploading video to YouTube: ${videoData.script.title}`);

      const videoFile = await fs.readFile(videoData.videoFile);

      const response = await this.youtube.videos.insert({
        part: 'id,snippet,status',
        requestBody: {
          snippet: {
            title: videoData.script.title,
            description: this.buildYouTubeDescription(videoData.script),
            tags: videoData.script.keywords,
            categoryId: '24', // Entertainment category
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en'
          },
          status: {
            privacyStatus: 'public', // or 'private' for review first
            madeForKids: true,
            selfDeclaredMadeForKids: true
          }
        },
        media: {
          body: videoFile
        }
      });

      const videoId = response.data.id;

      // Upload thumbnail if available
      if (videoData.thumbnail) {
        const thumbnailFile = await fs.readFile(videoData.thumbnail);

        await this.youtube.thumbnails.set({
          videoId: videoId,
          media: {
            body: thumbnailFile
          }
        });
      }

      this.logger.info(`✅ Video uploaded successfully: https://youtube.com/watch?v=${videoId}`);

      // Update video status
      await this.videoDb.updateVideoStatus(videoData.id, 'published', {
        youtubeId: videoId,
        publishedAt: new Date()
      });

      return {
        youtubeId: videoId,
        url: `https://youtube.com/watch?v=${videoId}`
      };

    } catch (error) {
      this.logger.error('❌ Failed to upload video to YouTube:', error);
      throw error;
    }
  }

  buildYouTubeDescription(script) {
    return `${script.description}

🌟 Welcome to TinyTales! 🌟

Join us on magical adventures filled with friendship, learning, and fun! Perfect for kids aged ${script.targetAge}.

✨ What you'll learn: ${script.theme}
📚 Story type: ${script.storyType}
🎯 Great for: Family time, bedtime stories, educational entertainment

👍 Like this video if you enjoyed it!
🔔 Subscribe for new stories every day!
💬 Tell us in the comments what story you'd like to see next!

#KidsStories #ChildrensContent #TinyTales #${script.theme.replace(' ', '')} #EducationalContent #FamilyFriendly

---
TinyTales creates magical, educational content for children. All our stories are designed to inspire, teach, and entertain young minds in a safe, positive environment.`;
  }

  async getHealthStatus() {
    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      lastVideoCreated: await this.videoDb.getLastVideoTime(),
      totalVideos: await this.videoDb.getVideoCount(),
      avgProductionTime: await this.videoDb.getAverageProductionTime(),
      diskSpace: await this.checkDiskSpace()
    };
  }

  async checkDiskSpace() {
    try {
      const stats = await fs.stat('./output');
      return {
        available: true,
        path: './output'
      };
    } catch {
      return {
        available: false,
        path: './output'
      };
    }
  }

  async shutdown() {
    this.logger.info('⏹️ Shutting down Video Production Agent...');

    if (this.videoDb) {
      await this.videoDb.disconnect();
    }

    this.isInitialized = false;
    this.logger.info('✅ Video Production Agent shutdown complete');
  }
}