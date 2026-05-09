document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileDetails = document.getElementById('fileDetails');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');
    const compressionOptions = document.getElementById('compressionOptions');
    const targetSizeInput = document.getElementById('targetSize');
    const outputFormatSelect = document.getElementById('outputFormat');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const compressButton = document.getElementById('compressButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const resultSection = document.getElementById('resultSection');
    const originalSizeEl = document.getElementById('originalSize');
    const compressedSizeEl = document.getElementById('compressedSize');
    const reductionEl = document.getElementById('reduction');
    const downloadLink = document.getElementById('downloadLink');
    const compressAnother = document.getElementById('compressAnother');

    // Variables to store file data
    let currentFile = null;
    let compressedBlob = null;
    let ffmpeg = null;
    let isFFmpegLoaded = false;
    let isFFmpegLoading = false;
    
    // Quality labels
    const qualityLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    
    // Update quality label when slider changes
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = qualityLabels[parseInt(this.value) - 1];
    });
    
    // File Drop Area Event Listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files[0]);
        }
    }
    
    // Handle file input change
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files[0]);
        }
    });
    
    // Process the selected file
    function handleFiles(file) {
        if (!file.type.match('audio.*') && !file.type.match('video.*')) {
            alert('Please select an audio or video file.');
            return;
        }
        
        currentFile = file;
        displayFileDetails(file);
        showCompressionOptions();
        
        // Load FFmpeg if not already loaded
        if (!isFFmpegLoaded && !isFFmpegLoading) {
            loadFFmpeg();
        }
    }
    
    // Load FFmpeg WASM
    async function loadFFmpeg() {
        try {
            isFFmpegLoading = true;
            
            // Load FFmpeg script dynamically
            if (!window.FFmpeg) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
                script.async = true;
                document.body.appendChild(script);
                
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load FFmpeg script'));
                });
            }
            
            // Create FFmpeg instance
            ffmpeg = FFmpeg.createFFmpeg({ 
                log: true,
                corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
            });
            await ffmpeg.load();
            
            isFFmpegLoaded = true;
            isFFmpegLoading = false;
            console.log('FFmpeg loaded successfully');
        } catch (error) {
            console.error('Error loading FFmpeg:', error);
            alert('Failed to load compression library. Please try again or use a different browser.');
            isFFmpegLoading = false;
        }
    }
    
    // Display file details
    function displayFileDetails(file) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileDetails.classList.remove('hidden');
    }
    
    // Format file size for display
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Show compression options
    function showCompressionOptions() {
        compressionOptions.classList.remove('hidden');
        
        // Set output format options based on file type
        if (currentFile.type.match('audio.*')) {
            // Show only audio formats
            Array.from(outputFormatSelect.options).forEach(option => {
                if (['same', 'mp3', 'wav', 'ogg'].includes(option.value)) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            });
        } else if (currentFile.type.match('video.*')) {
            // Show only video formats
            Array.from(outputFormatSelect.options).forEach(option => {
                if (['same', 'mp4', 'webm'].includes(option.value)) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            });
        }
    }
    
    // Remove file button
    removeFile.addEventListener('click', function() {
        resetUI();
    });
    
    // Reset UI to initial state
    function resetUI() {
        currentFile = null;
        compressedBlob = null;
        fileInput.value = '';
        fileDetails.classList.add('hidden');
        compressionOptions.classList.add('hidden');
        progressContainer.classList.add('hidden');
        resultSection.classList.add('hidden');
    }
    
    // Update progress bar
    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
        progressPercentage.textContent = `${Math.round(percent)}%`;
    }
    
    // Compress button click handler
    compressButton.addEventListener('click', async function() {
        if (!currentFile) return;
        
        if (!isFFmpegLoaded) {
            if (isFFmpegLoading) {
                alert('FFmpeg is still loading. Please wait a moment and try again.');
            } else {
                alert('Compression library not loaded. Please refresh the page and try again.');
                loadFFmpeg();
            }
            return;
        }
        
        const targetSize = parseInt(targetSizeInput.value) * 1024 * 1024; // Convert MB to bytes
        const outputFormat = outputFormatSelect.value;
        const quality = parseInt(qualitySlider.value);
        
        // Show progress UI
        compressionOptions.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressPercentage.textContent = '0%';
        
        // Perform actual compression
        try {
            await compressMedia(currentFile, targetSize, outputFormat, quality);
        } catch (error) {
            console.error('Compression error:', error);
            alert('An error occurred during compression. Please try again with a different file or settings.');
            resetUI();
        }
    });
    
    // Perform actual media compression using FFmpeg
    async function compressMedia(file, targetSize, outputFormat, quality) {
        updateProgress(5); // Start progress
        
        // Determine input and output formats
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();
        const isVideo = file.type.startsWith('video/');
        
        // Determine output format
        let outputExt = outputFormat;
        if (outputFormat === 'same') {
            outputExt = isVideo ? 'mp4' : 'mp3'; // Default to mp4/mp3 if 'same' is selected
            if (isVideo && ['mp4', 'webm', 'mov'].includes(fileExt)) {
                outputExt = fileExt;
            } else if (!isVideo && ['mp3', 'wav', 'ogg'].includes(fileExt)) {
                outputExt = fileExt;
            }
        }
        
        // Create input file name
        const inputName = `input.${fileExt}`;
        const outputName = `output.${outputExt}`;
        
        // Read file data
        updateProgress(10);
        const data = await file.arrayBuffer();
        const inputData = new Uint8Array(data);
        
        // Write input file to FFmpeg virtual file system
        updateProgress(20);
        ffmpeg.FS('writeFile', inputName, inputData);
        
        // Calculate bitrate based on target size and duration
        let duration = 0;
        try {
            // Create a temporary URL for the file
            const tempURL = URL.createObjectURL(file);
            
            // Create a media element to get duration
            const mediaElement = isVideo ? document.createElement('video') : document.createElement('audio');
            mediaElement.style.display = 'none';
            document.body.appendChild(mediaElement);
            
            // Get duration
            await new Promise((resolve, reject) => {
                mediaElement.onloadedmetadata = resolve;
                mediaElement.onerror = reject;
                mediaElement.src = tempURL;
            });
            
            duration = mediaElement.duration;
            
            // Clean up
            URL.revokeObjectURL(tempURL);
            document.body.removeChild(mediaElement);
        } catch (error) {
            console.error('Error getting duration:', error);
            // Use file size as fallback to estimate duration
            const bitrate = isVideo ? 5000000 : 320000; // Assume 5 Mbps for video, 320 kbps for audio
            duration = (file.size * 8) / bitrate;
        }
        
        // Calculate target bitrate (bits per second)
        // Leave some margin for container overhead
        const marginFactor = 0.9;
        const targetBitrate = Math.floor((targetSize * 8 * marginFactor) / duration);
        
        updateProgress(30);
        
        // Prepare FFmpeg command based on file type and quality
        let ffmpegArgs = [];
        
        // Input file
        ffmpegArgs.push('-i', inputName);
        
        // Set quality and bitrate parameters
        if (isVideo) {
            // Video compression settings
            const crf = 28 - (quality * 4); // Quality: 1=28, 2=24, 3=20, 4=16, 5=12 (lower is better)
            const preset = quality <= 2 ? 'veryfast' : quality === 3 ? 'medium' : 'slow';
            
            ffmpegArgs = ffmpegArgs.concat([
                '-c:v', outputExt === 'webm' ? 'libvpx-vp9' : 'libx264',
                '-b:v', `${targetBitrate}`,
                '-maxrate', `${targetBitrate * 1.5}`,
                '-bufsize', `${targetBitrate * 2}`,
                '-preset', preset,
                '-crf', crf.toString(),
                '-c:a', outputExt === 'webm' ? 'libopus' : 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-y' // Overwrite output files without asking
            ]);
        } else {
            // Audio compression settings
            const audioBitrate = Math.min(targetBitrate, 320000); // Cap at 320kbps
            
            if (outputExt === 'mp3') {
                ffmpegArgs = ffmpegArgs.concat([
                    '-c:a', 'libmp3lame',
                    '-b:a', `${audioBitrate}`,
                    '-q:a', (6 - quality).toString(), // Quality: 1=5, 2=4, 3=3, 4=2, 5=1 (lower is better)
                ]);
            } else if (outputExt === 'ogg') {
                ffmpegArgs = ffmpegArgs.concat([
                    '-c:a', 'libvorbis',
                    '-b:a', `${audioBitrate}`,
                    '-q:a', quality.toString(),
                ]);
            } else { // wav or other
                ffmpegArgs = ffmpegArgs.concat([
                    '-c:a', 'pcm_s16le',
                    '-ar', (44100 + (quality - 3) * 4000).toString(), // Sample rate based on quality
                ]);
            }
            
            ffmpegArgs.push('-y'); // Overwrite output files without asking
        }
        
        // Output file
        ffmpegArgs.push(outputName);
        
        // Run FFmpeg command
        updateProgress(40);
        console.log('FFmpeg command:', ffmpegArgs);
        
        try {
            // Set up progress monitoring
            let lastProgress = 40;
            ffmpeg.setProgress(({ ratio }) => {
                if (!isNaN(ratio) && ratio >= 0 && ratio <= 1) {
                    // Map ratio (0-1) to our range (40-90%)
                    const progress = 40 + (ratio * 50);
                    if (progress > lastProgress) {
                        updateProgress(progress);
                        lastProgress = progress;
                    }
                }
            });
            
            // Execute FFmpeg command
            await ffmpeg.run(...ffmpegArgs);
            updateProgress(90);
            
            // Read the output file from the virtual file system
            const outputData = ffmpeg.FS('readFile', outputName);
            
            // Create a Blob from the output data
            const outputBlob = new Blob(
                [outputData.buffer], 
                { type: isVideo ? `video/${outputExt}` : `audio/${outputExt}` }
            );
            
            // Clean up files from virtual filesystem
            try {
                ffmpeg.FS('unlink', inputName);
                ffmpeg.FS('unlink', outputName);
            } catch (e) {
                console.warn('Error cleaning up files:', e);
            }
            
            // Update UI with results
            displayCompressionResults(file, outputBlob, outputExt);
            
        } catch (error) {
            console.error('FFmpeg processing error:', error);
            throw error;
        }
    }
    
    // Display compression results
    function displayCompressionResults(originalFile, compressedFile, outputExt) {
        compressedBlob = compressedFile;
        
        const originalSize = originalFile.size;
        const compressedSize = compressedFile.size;
        const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        originalSizeEl.textContent = formatFileSize(originalSize);
        compressedSizeEl.textContent = formatFileSize(compressedSize);
        reductionEl.textContent = `${reduction}%`;
        
        // Create download link
        const url = URL.createObjectURL(compressedFile);
        downloadLink.href = url;
        
        // Set file name for download
        const originalName = originalFile.name.split('.')[0];
        downloadLink.download = `${originalName}_compressed.${outputExt}`;
        
        // Hide progress and show results
        progressContainer.classList.add('hidden');
        resultSection.classList.remove('hidden');
        
        // Add event listener to release object URL when done
        downloadLink.addEventListener('click', function() {
            // Give browser time to start the download before revoking
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
        });
    }
    
    // Compress Another button
    compressAnother.addEventListener('click', function() {
        resetUI();
        // Release blob memory
        if (compressedBlob) {
            compressedBlob = null;
        }
    });
});