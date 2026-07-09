const express = require("express");
const mysql = require("mysql2");
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { PDFParse } = require('pdf-parse');
const https = require('https');
let multer = null;

try {
    multer = require('multer');
} catch (err) {
    multer = null;
}

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config({path:'./.env'});

const options = {                
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.DB
};
//console.log(uuid());
const db = mysql.createConnection(options);
const sessionStore = new MySQLStore({}, db);

// Extract batch year from IIITA email (e.g. iec2021001@iiita.ac.in → 2021)
function getBatchFromEmail(email){
    var m = email && email.match(/[a-z]{2,3}(\d{4})\d+@iiita\.ac\.in/i);
    return m ? m[1] : null;
}

app.use(express.static(__dirname+'/assets'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({
    extended:false
}));

const resumeUpload = multer ? multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: function(req, file, cb){
        if(file.mimetype !== 'application/pdf'){
            return cb(new Error('Please upload your resume as a PDF file.'));
        }
        cb(null, true);
    }
}) : null;
const MAX_RESUME_TEXT_CHARS = 7000;

// Prevent browser from caching pages (fixes back-button showing stale data)
app.use(function(req, res, next){
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(session({
    
        genid: (req) => {
            return uuidv4() // use UUIDs for session IDs
          },
        secret: 'cookie_secret',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,      // assigning sessionStore to the session
    }));
const path = require("path");
app.set('views', path.join(__dirname, 'views'));

// connecting database
db.connect(function(error){
    if(error)
    {
      console.log(error);
    }else{
        console.log("Database connected!!");
    }
})


    var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
            user: process.env.authemail,			//email ID
            pass: process.env.authepass				//Password 
        }
    });


    function sendMail(email, sub, bodi){
        var details = {
            from: 'sktsdhkhn@gmail.com', // sender address same as above
            to: email, 					// Receiver's email id
            subject: sub, // Subject of the mail.
            html: bodi					// Sending OTP 
        };


	transporter.sendMail(details, function (error, data) {
		if(error)
			console.log(error)
		else
			console.log(data);
		});
	}


const redirectULogin = function(req,res,next){
    if(!req.session.loggedin)
    {
        return res.render('register',{message:''});
    }
    next();
}


const redirectALogin = function(req,res,next){
    if(!req.session.loggedinadmin)
    {
        return res.render('registeradmin',{message:''});
    }
    next();
}

// password generation
function generatePassword() {
    var length = 12,
        charset = 
"@#$&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$&*0123456789abcdefghijklmnopqrstuvwxyz",
        password = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
}

function handleResumeUpload(req, res, next){
    if(!resumeUpload){
        return res.render('error', {
            message: 'Resume analyzer upload dependency is not installed yet. Run npm install multer and try again.',
            code: 'placements'
        });
    }

    resumeUpload.single('resume_pdf')(req, res, function(err){
        if(err){
            return res.render('error', {
                message: err.message || 'Unable to upload resume PDF.',
                code: 'placements'
            });
        }
        next();
    });
}

function parseAiJson(text){
    if(!text) return null;
    var cleaned = text.trim();
    if(cleaned.indexOf('```') === 0){
        cleaned = cleaned.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    }
    try {
        return JSON.parse(cleaned);
    } catch (err) {
        return null;
    }
}

function cleanResumeText(text){
    return (text || '')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function hasAny(text, words){
    return words.some(function(word){
        return text.indexOf(word.toLowerCase()) !== -1;
    });
}

function findMissingKeywords(text, words, limit){
    var missing = [];
    for(var i = 0; i < words.length; i++){
        if(text.indexOf(words[i].toLowerCase()) === -1){
            missing.push(words[i]);
        }
        if(missing.length >= limit) break;
    }
    return missing;
}

function getRoleKeywords(context){
    var roleText = ((context.role || '') + ' ' + (context.description || '')).toLowerCase();
    var sets = {
        software: ['Data Structures', 'Algorithms', 'OOP', 'REST API', 'SQL', 'Git', 'Testing', 'System Design'],
        backend: ['Node.js', 'Express', 'REST API', 'SQL', 'MongoDB', 'Authentication', 'Caching', 'System Design'],
        frontend: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design', 'API Integration', 'Accessibility'],
        fullstack: ['React', 'Node.js', 'Express', 'REST API', 'Database', 'Authentication', 'Deployment'],
        data: ['Python', 'SQL', 'Pandas', 'NumPy', 'Visualization', 'Statistics', 'Machine Learning'],
        ml: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Preprocessing', 'Model Evaluation'],
        analyst: ['SQL', 'Excel', 'Python', 'Power BI', 'Tableau', 'Statistics', 'Dashboards'],
        devops: ['Linux', 'Docker', 'CI/CD', 'AWS', 'Kubernetes', 'Monitoring', 'Shell Scripting'],
        security: ['Network Security', 'OWASP', 'Cryptography', 'Linux', 'Burp Suite', 'Vulnerability Assessment']
    };

    if(/frontend|front end|ui|react|web developer/.test(roleText)) return sets.frontend;
    if(/backend|back end|server|api/.test(roleText)) return sets.backend;
    if(/fullstack|full stack|mern|mean/.test(roleText)) return sets.fullstack;
    if(/machine learning| ml |ai engineer|data scientist|deep learning/.test(roleText)) return sets.ml;
    if(/data analyst|business analyst|analytics|bi /.test(roleText)) return sets.analyst;
    if(/data engineer|data/.test(roleText)) return sets.data;
    if(/devops|cloud|sre|platform/.test(roleText)) return sets.devops;
    if(/security|cyber|infosec/.test(roleText)) return sets.security;
    return sets.software;
}

function localResumeAnalysis(resumeText, context){
    var text = resumeText.toLowerCase();
    var roleKeywords = getRoleKeywords(context);
    var generalKeywords = ['project', 'internship', 'experience', 'skills', 'education', 'achievement', 'github', 'linkedin'];
    var actionWords = ['built', 'developed', 'implemented', 'designed', 'optimized', 'deployed', 'created', 'led', 'improved'];
    var hasMetrics = /\b\d+(\.\d+)?\s*(%|percent|users|ms|seconds|minutes|hours|x|lpa|stars|downloads|requests|records)?\b/i.test(resumeText);
    var score = 45;
    var strengths = [];
    var improvements = [];
    var quickFixes = [];
    var roleFitNotes = [];

    if(hasAny(text, ['project', 'projects'])) {
        score += 10;
        strengths.push('Project work is visible, which is important for campus recruitment screening.');
    } else {
        improvements.push('Add 2-3 strong academic or personal projects with tech stack, problem solved, and outcome.');
    }

    if(hasAny(text, ['intern', 'internship', 'experience', 'training'])) {
        score += 8;
        strengths.push('Experience or internship section is present.');
    } else {
        improvements.push('If you do not have internship experience, add a clear projects section that demonstrates practical work.');
    }

    if(hasAny(text, ['skill', 'skills', 'technical skills', 'technologies'])) {
        score += 8;
        strengths.push('Technical skills are mentioned.');
    } else {
        improvements.push('Add a dedicated technical skills section near the top of the resume.');
    }

    if(hasAny(text, ['github', 'linkedin', 'portfolio', 'leetcode', 'codechef', 'codeforces'])) {
        score += 7;
        strengths.push('Profile or coding links are included.');
    } else {
        quickFixes.push('Add GitHub, LinkedIn, and coding profile links in the header.');
    }

    if(hasMetrics) {
        score += 10;
        strengths.push('Some measurable details are present.');
    } else {
        improvements.push('Add numbers to project bullets, such as accuracy, users, response time, dataset size, or performance improvement.');
    }

    if(hasAny(text, actionWords)) {
        score += 7;
        strengths.push('Some action-oriented wording is present.');
    } else {
        quickFixes.push('Start project bullets with action verbs like Built, Developed, Optimized, Deployed, or Implemented.');
    }

    var matchedRoleKeywords = roleKeywords.filter(function(word){
        return text.indexOf(word.toLowerCase()) !== -1;
    });
    score += Math.min(matchedRoleKeywords.length * 3, 15);
    if(matchedRoleKeywords.length > 0){
        roleFitNotes.push('Resume already contains role-relevant terms: ' + matchedRoleKeywords.slice(0, 5).join(', ') + '.');
    } else {
        roleFitNotes.push('Resume does not strongly show keywords for the selected role yet.');
    }

    if(resumeText.length < 1200){
        improvements.push('Resume text looks short. Add stronger project bullets, responsibilities, and achievements.');
        score -= 5;
    }
    if(resumeText.length > 6000){
        quickFixes.push('Keep the resume concise. Prioritize the most relevant projects for this role.');
    }

    var missingKeywords = findMissingKeywords(text, roleKeywords.concat(generalKeywords), 8);
    if(missingKeywords.length){
        quickFixes.push('Add missing role keywords only where they are truthful and backed by project work.');
    }

    if(context.studentCgpa && Number(context.studentCgpa) >= Number(context.min_cgpa || 0)){
        roleFitNotes.push('Academic eligibility looks aligned with this drive.');
    }
    score = Math.max(35, Math.min(92, score));
    return {
        score: score,
        summary: 'Local resume check completed for ' + context.company_name + ' - ' + context.role + '. This rule-based review focuses on role keywords, project strength, links, metrics, and resume completeness.',
        strengths: strengths.length ? strengths.slice(0, 5) : ['Resume was readable and could be checked locally.'],
        missing_keywords: missingKeywords,
        improvements: improvements.slice(0, 6),
        role_fit_notes: roleFitNotes.slice(0, 5),
        quick_fixes: quickFixes.slice(0, 6)
    };
}

async function extractResumeText(file){
    const parser = new PDFParse({ data: file.buffer });
    try {
        const parsed = await parser.getText({ first: 1, last: 2 });
        const text = cleanResumeText(parsed.text);
        if(!text || text.length < 80){
            throw new Error('Could not read enough text from this PDF. Please upload a text-based resume PDF, not a scanned image.');
        }
        return text.length > MAX_RESUME_TEXT_CHARS ? text.slice(0, MAX_RESUME_TEXT_CHARS) : text;
    } finally {
        await parser.destroy();
    }
}

const GEMINI_TIMEOUT_MS = 12000;

function callGemini(prompt) {
    return new Promise(function(resolve, reject) {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
        if (!apiKey) return reject(new Error('GEMINI_NO_KEY'));

        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: '/v1beta/models/' + model + ':generateContent?key=' + apiKey,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        let req;
        const timer = setTimeout(function() {
            if (req) req.destroy();
            reject(new Error('GEMINI_TIMEOUT'));
        }, GEMINI_TIMEOUT_MS);

        req = https.request(options, function(res) {
            let data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                clearTimeout(timer);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        if (parsed.error.code === 429) return reject(new Error('GEMINI_QUOTA'));
                        return reject(new Error('GEMINI_ERROR: ' + parsed.error.message));
                    }
                    const text = parsed.candidates &&
                        parsed.candidates[0] &&
                        parsed.candidates[0].content &&
                        parsed.candidates[0].content.parts &&
                        parsed.candidates[0].content.parts[0] &&
                        parsed.candidates[0].content.parts[0].text;
                    if (!text) return reject(new Error('GEMINI_EMPTY'));
                    resolve(text);
                } catch (e) {
                    reject(new Error('GEMINI_PARSE_ERROR'));
                }
            });
        });

        req.on('error', function(e) {
            clearTimeout(timer);
            reject(e);
        });

        req.write(body);
        req.end();
    });
}

function buildResumePrompt(resumeText, context) {
    return 'You are an expert resume reviewer for campus placements. Analyze the following student resume for a ' + context.role + ' position at ' + context.company_name + ' (Package: ' + (context.package_lpa || 'N/A') + ' LPA).\n\n' +
        'Company/Role Details:\n' +
        '- Role: ' + context.role + '\n' +
        '- Company: ' + context.company_name + '\n' +
        '- Min CGPA Required: ' + context.min_cgpa + '\n' +
        '- Eligible Branches: ' + context.eligible_branches + '\n' +
        (context.description ? '- Job Description: ' + context.description + '\n' : '') +
        '\nStudent Info:\n' +
        '- Branch: ' + context.studentBranch + '\n' +
        '- CGPA: ' + context.studentCgpa + '\n' +
        '\nResume Text:\n"""\n' + resumeText + '\n"""\n\n' +
        'Respond with ONLY a raw JSON object (no markdown, no code fences). Use exactly this structure:\n' +
        '{\n' +
        '  "score": <integer 0-100>,\n' +
        '  "summary": "<2-3 sentence overall assessment>",\n' +
        '  "strengths": ["<up to 5 specific strengths>"],\n' +
        '  "missing_keywords": ["<up to 6 keywords missing for this role>"],\n' +
        '  "improvements": ["<up to 5 actionable improvement suggestions>"],\n' +
        '  "role_fit_notes": ["<up to 4 notes on fit for this specific role/company>"],\n' +
        '  "quick_fixes": ["<up to 5 quick wins like formatting, links, ATS tips>"]\n' +
        '}';
}

async function analyzeResumePdf(file, context){
    const resumeText = await extractResumeText(file);

    // Try Gemini first; fall back to local on quota/timeout/any error
    try {
        const prompt = buildResumePrompt(resumeText, context);
        const geminiText = await callGemini(prompt);
        const parsed = parseAiJson(geminiText);
        if (parsed && typeof parsed.score !== 'undefined' && Array.isArray(parsed.strengths)) {
            parsed._source = 'gemini';
            return parsed;
        }
        throw new Error('GEMINI_INVALID_STRUCTURE');
    } catch (err) {
        console.log('[Resume Analyzer] Gemini unavailable (' + err.message + ') – falling back to local analysis.');
        const local = localResumeAnalysis(resumeText, context);
        local._source = 'local';
        return local;
    }
}

// API'S

app.get("/",function(req,res){
    // Redirect logged-in users to their respective dashboards
    if(req.session.loggedinadmin){
        return res.redirect('/adminlog');
    }
    if(req.session.loggedin){
        return res.redirect('/home');
    }
    res.render('index',{message:''});
})




app.get("/signup",function(req,res){
    res.render('register',{message:''});
})

app.get("/logout",function(req,res){
    var ss = sessionStore.sessions;
    for(var sid in ss){ 
        var ses = JSON.parse(ss[sid]);
        console.log(ses);
    }
    req.session.destroy((err) => {
        res.redirect('/');
      })
})

app.get("/alogout",function(req,res){
    req.session.destroy((err) => {
        res.redirect('/');
      })
})

app.get("/adminsignup",function(req,res){
    res.render('registeradmin',{message:''});
})


app.get("/forgotpass",function(req,res){
    res.render('fpass',{message:''});
})

app.get("/cpass", redirectULogin, function(req,res){
    res.render('cpass',{message:''});
})

app.get("/aforgotpass",function(req,res){
    res.render('adminfpass',{message:''});
})

app.get("/sb",redirectULogin,function(req,res){
    const email = req.session.email;
    db.query('SELECT * from student_basic WHERE email = ?',[email],function(err,result){
        if(err) console.log(err);
        return res.render('sbdetails',{message:'', email: email, existing: (result && result[0]) || null});
    });
})

app.get("/acad",redirectULogin,function(req,res){
    const email = req.session.email;
    db.query('SELECT * from academic_details WHERE email = ?',[email],function(err,result){
        if(err) console.log(err);
        db.query('SELECT * from change_requests WHERE email = ? AND req_type = "academic" AND status = "pending" ORDER BY created_at DESC LIMIT 1',[email],function(err,pending){
            if(err) console.log(err);
            db.query('SELECT id, status, reason, admin_remarks, created_at, reviewed_at FROM change_requests WHERE email = ? AND req_type = "academic" ORDER BY created_at DESC LIMIT 5',[email],function(err,history){
                if(err) console.log(err);
                return res.render('academic_details',{message:'', existing: (result && result[0]) || null, pendingRequest: (pending && pending[0]) || null, requestHistory: history || []});
            });
        });
    });
})

app.get("/nacad",redirectULogin,function(req,res){
    const email = req.session.email;
    db.query('SELECT * from non_academic_details WHERE email = ?',[email],function(err,result){
        if(err) console.log(err);
        db.query('SELECT * from change_requests WHERE email = ? AND req_type = "non_academic" AND status = "pending" ORDER BY created_at DESC LIMIT 1',[email],function(err,pending){
            if(err) console.log(err);
            db.query('SELECT id, status, reason, admin_remarks, created_at, reviewed_at FROM change_requests WHERE email = ? AND req_type = "non_academic" ORDER BY created_at DESC LIMIT 5',[email],function(err,history){
                if(err) console.log(err);
                return res.render('non_academic',{message:'', existing: (result && result[0]) || null, pendingRequest: (pending && pending[0]) || null, requestHistory: history || []});
            });
        });
    });
})

app.get("/skills",redirectULogin,function(req,res){
    const email = req.session.email;
    db.query('SELECT * from skills WHERE email = ?',[email],function(err,result){
        if(err) console.log(err);
        return res.render('skills',{message:'', existing: (result && result[0]) || null});
    });
})

app.get("/review",function(req,res){
    res.render('review',{message:''});
})

// fetching data from datbase (SQL)
app.get("/adminlog", redirectALogin, async function(req,res){
    var emptyDashboard = {
        message: [],
        reviw: [],
        totalStudents: 0,
        placedStudents: 0,
        branchStats: [],
        branchPlacementStats: [],
        totalDrives: 0,
        totalCompanies: 0,
        driveStats: [],
        cgpaDist: [],
        placedList: [],
        allStudents: [],
        drives: [],
        companies: [],
        changeRequests: [],
        batchStats: []
    };

    try {
        const [
            [pendingRequests],
            [reviews],
            [totalRes],
            [placedRes],
            [branchStats],
            [branchPlacementStats],
            [driveCountRes],
            [companyCountRes],
            [driveStats],
            [cgpaDist],
            [placedList],
            [allStudents],
            [drives],
            [companies],
            [changeRequests],
            [batchStats]
        ] = await Promise.all([
            db.promise().query('SELECT * FROM change_requests WHERE status = "pending" ORDER BY created_at DESC'),
            db.promise().query('SELECT * FROM review'),
            db.promise().query('SELECT COUNT(*) as total FROM student_basic'),
            db.promise().query("SELECT COUNT(DISTINCT email) as placed FROM applications WHERE status = 'selected'"),
            db.promise().query("SELECT sb.branch, COUNT(*) as count, ROUND(AVG(CAST(ad.cur_cgpa AS DECIMAL(4,2))),2) as avg_cgpa FROM student_basic sb LEFT JOIN academic_details ad ON sb.email = ad.email GROUP BY sb.branch"),
            db.promise().query("SELECT sb.branch, COUNT(DISTINCT sb.email) as total, COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN sb.email END) as placed FROM student_basic sb LEFT JOIN applications a ON sb.email = a.email GROUP BY sb.branch ORDER BY sb.branch"),
            db.promise().query("SELECT COUNT(*) as count FROM placement_drives"),
            db.promise().query("SELECT COUNT(*) as count FROM companies"),
            db.promise().query("SELECT pd.status, COUNT(*) as count FROM placement_drives pd GROUP BY pd.status"),
            db.promise().query("SELECT CASE WHEN CAST(cur_cgpa AS DECIMAL(4,2)) >= 9 THEN '9-10' WHEN CAST(cur_cgpa AS DECIMAL(4,2)) >= 8 THEN '8-9' WHEN CAST(cur_cgpa AS DECIMAL(4,2)) >= 7 THEN '7-8' WHEN CAST(cur_cgpa AS DECIMAL(4,2)) >= 6 THEN '6-7' ELSE 'Below 6' END as cgpa_range, COUNT(*) as count FROM academic_details WHERE cur_cgpa IS NOT NULL AND cur_cgpa != '' GROUP BY cgpa_range ORDER BY cgpa_range DESC"),
            db.promise().query("SELECT sb.name, sb.email, sb.branch, sb.batch, ad.cur_cgpa, c.name as company_name, pd.role, pd.package_lpa FROM applications a JOIN student_basic sb ON a.email = sb.email LEFT JOIN academic_details ad ON a.email = ad.email JOIN placement_drives pd ON a.drive_id = pd.id JOIN companies c ON pd.company_id = c.id WHERE a.status = 'selected' ORDER BY c.name, sb.name"),
            db.promise().query("SELECT sb.name, sb.email, sb.branch, sb.batch, sb.role as designation, ad.cur_cgpa, ad.backlogs FROM student_basic sb LEFT JOIN academic_details ad ON sb.email = ad.email ORDER BY sb.branch, sb.name"),
            db.promise().query("SELECT pd.*, c.name as company_name, (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as applicant_count FROM placement_drives pd JOIN companies c ON pd.company_id = c.id ORDER BY pd.created_at DESC"),
            db.promise().query("SELECT * FROM companies ORDER BY name"),
            db.promise().query("SELECT cr.*, sb.name as student_name FROM change_requests cr LEFT JOIN student_basic sb ON cr.email = sb.email ORDER BY cr.created_at DESC"),
            db.promise().query("SELECT sb.batch, COUNT(DISTINCT sb.email) as total, COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN sb.email END) as placed FROM student_basic sb LEFT JOIN applications a ON sb.email = a.email WHERE sb.batch IS NOT NULL GROUP BY sb.batch ORDER BY sb.batch DESC")
        ]);

        return res.render('admind', {
            message: pendingRequests || [],
            reviw: reviews || [],
            totalStudents: totalRes[0] ? totalRes[0].total : 0,
            placedStudents: placedRes[0] ? placedRes[0].placed : 0,
            branchStats: branchStats || [],
            branchPlacementStats: branchPlacementStats || [],
            totalDrives: driveCountRes[0] ? driveCountRes[0].count : 0,
            totalCompanies: companyCountRes[0] ? companyCountRes[0].count : 0,
            driveStats: driveStats || [],
            cgpaDist: cgpaDist || [],
            placedList: placedList || [],
            allStudents: allStudents || [],
            drives: drives || [],
            companies: companies || [],
            changeRequests: changeRequests || [],
            batchStats: batchStats || []
        });
    } catch(err) {
        console.log(err);
        return res.render('admind', emptyDashboard);
    }
});

app.get("/home",redirectULogin,function(req,res){
    const email = req.session.email;
     db.query('SELECT * from student_basic WHERE email = ?',[email],function(err,basic)
             {
                 if(err) {
                     console.log(err);
                 }
                 else if(basic.length<=0){
                    return res.render('error',{
                        message: 'Something went wrong.Try again',
                        code:''
                       });
                 }
                 else{
                    db.query('SELECT * from skills WHERE email = ?',[email],function(err,skill)
                    {
                        if(err) {
                            console.log(err);
                        }  
                        else
                        {
                            db.query('SELECT * from academic_details WHERE email = ?',[email],function(err,acad)
                                {
                                    if(err) {
                                        console.log(err);
                                    }  
                                    else
                                    {
                                            db.query('SELECT * from non_academic_details WHERE email = ?',[email],function(err,nacad)
                                            {
                                                if(err) {
                                                    console.log(err);
                                                }  
                                                else
                                                {
                                                    return res.render('home',{
                                                        message: basic[0],
                                                        skill: skill[0],
                                                        acad: acad[0],
                                                        nacad: nacad[0],
                                                        code:'home'
                                                    });
                                                }
                                        })
                                    }
                            })
                        }
                   })
                 }
            })
})
                        


app.post("/signup",function(req,res){
    const { username, email, pass, confirmpass} = req.body;
    const ques = req.body.securityq;
    if(email.endsWith("@iiita.ac.in")==false)
    {
        return res.render('error',{
            message: 'Only IIITA domains can register',
            code:'signup'
           });
    }
    db.query('SELECT email from student_credentials WHERE email = ?',[email],async function(err,result)
    {
        if(err) {
            console.log(err);
        }
        if(result.length > 0){
           return res.render('error',{
            message: 'User is already registered. Kindly Login',
            code:'signup'
           });
        }else if (pass != confirmpass){
            return res.render('error',{
                message: 'Passwords does not match',
                code:'signup'
               });
           }
        let hashpass = await bcrypt.hash(pass,8); 
        console.log(hashpass);
        db.query('INSERT INTO student_credentials SET ?',{
            UserName: username,
            email: email,
            Password: hashpass,
         },function(error,result){
            if(error){
                console.log(error);
            }
            else{
                console.log(result);
                return res.render('success',{
                    message: 'User registered successfully',
                    code:'signup'
                   });
            }
         })
    })
});

  
  
app.post("/fpass",  function (req,res){
    const  email = req.body.email;
    console.log(email);
    db.query('SELECT * from student_credentials WHERE email = ?',[email],async function(err,result)
    {
        if(err) {
            console.log(err);
        }
        if(result.length <= 0){
           return res.render('error',{
            message: 'Wrong email id',
            code:'signup'
           });
        }
        let pass = generatePassword();
        console.log(pass);
        let hashpass = await bcrypt.hash(pass,8);
        console.log(hashpass);
        db.query('UPDATE student_credentials SET ? WHERE email = ?',[{
            Password: hashpass
         },email],function(error,result){
            if(error){
                console.log(error);
            }
            else{
                sendMail(email,'Temporary password', pass + ' is your temporary password for IIITAPfolio');
                console.log(result);
                return res.render('success',{
                    message: 'Check your mail for temporary password',
                    code:'signup'
                   });
            }
         })
    });
});

app.post("/cpass",  async function (req,res){
    const email = req.session.email;
    const { pass, confirmpass} = req.body;
    if (pass != confirmpass){
        return res.render('error',{
            message: 'Passwords does not match',
            code:'fpass'
           });
       }
        let hashpass = await bcrypt.hash(pass,8);
        console.log(hashpass);
        db.query('UPDATE student_credentials SET ? WHERE email = ?',[{
            Password: hashpass
         },email],function(error,result){
            if(error){
                console.log(error);
            }
            else{
                console.log(result);
                
                return res.render('success',{
                    message: 'Password Changed successfully',
                    code:'home'
                   });
            }
         })
       
    });



app.post("/adminfpass",  function (req,res){
    const { email, pass, confirmpass, securityq} = req.body;
    db.query('SELECT Securityq from admin_credentials WHERE email = ?',[email], function(err,result)
    {
        if(err) {
            console.log(err);
        }
        if(result.length <= 0){
           return res.render('error',{
            message: 'Wrong email id',
            code:'adminsignup'
           });
        }else if (pass != confirmpass){
            return res.render('error',{
                message: 'Passwords does not match',
                code:'fpass'
               });
           }
           var savedQ = result[0].Securityq;
           console.log(securityq);
           if( securityq==savedQ)
           {
            console.log("YES");
        db.query('UPDATE admin_credentials SET ?',{
            Password: pass
         },function(error,result){
            if(error){
                console.log(error);
            }
            else{
                console.log(result);
                
                return res.render('success',{
                    message: 'Password Changed successfully',
                    code: 'adminsignup'
                   });
            }
         })
        }
        else{
            return res.render('error',{
                message: 'Security question answer does not match',
                code:'aforgotpass'
               });
        }
    });
});

app.post("/search",function(req,res){
    const email = req.body.id;
    console.log(email);
    db.query('SELECT * from student_basic WHERE email = ?',[email],function(err,basic)
    {
        if(err) {
            console.log(err);
        }
        else if(basic.length<=0){
           return res.render('error',{
               message: 'Profile of User is not ready. Try again later',
               code:''
              });
        }
        else{
           db.query('SELECT * from skills WHERE email = ?',[email],function(err,skill)
           {
               if(err) {
                   console.log(err);
               }  
               else
               {
                   db.query('SELECT * from academic_details WHERE email = ?',[email],function(err,acad)
                       {
                           if(err) {
                               console.log(err);
                           }  
                           else
                           {
                                   db.query('SELECT * from non_academic_details WHERE email = ?',[email],function(err,nacad)
                                   {
                                       if(err) {
                                           console.log(err);
                                       }  
                                       else
                                       {
                                           return res.render('home',{
                                               message: basic[0],
                                               skill: skill[0],
                                               acad: acad[0],
                                               nacad: nacad[0],
                                               code:'search'
                                           });
                                       }
                               })
                           }
                   })
               }
          })
        }
   })
        })

app.post("/signin",function(req,res){
    const { email, pass } = req.body;

    db.query('SELECT Password from student_credentials WHERE email = ?',[email],async function(err,result)
    {
        if(err) {
            console.log(err);
        }
        if(result.length > 0){
            var savedPass = result[0].Password;
            if( await bcrypt.compare(pass,savedPass))
            {
             req.session.loggedin = true;
             req.session.email = email;
             db.query('SELECT * from student_basic WHERE email = ?',[email],function(err,result)
             {
                 if(err) {
                     console.log(err);
                 }
                 if(result.length > 0){
                     res.redirect("/home");
                 }
                 else{
                return res.render('sbdetails',{
                message:'Enter',
                email: email,
                existing: null
                });} 
            })
            }else{
                return res.render('error',{
                    message: 'Password doesnt match',
                    code:'signup'
            });}
        
        }else {
            return res.render('error',{
                message: 'Account does not exist. Please SignUp',
                code:'signup'
               });
           }  
    })
});

app.post("/adminsignin",function(req,res){
    const { email, pass } = req.body;

    db.query('SELECT  Password from admin_credentials WHERE email = ?',[email], function(err,result)
    {
        if(err) {
            console.log(err);
        }
        if(result.length > 0){
            var savedPass = result[0].Password;
            if(pass==savedPass)
            {
                req.session.loggedinadmin = true;
                return res.redirect("/adminlog");
           } else{
            return res.render('error',{
                message: 'Password doesnt match',
                code:'adminsignup'
           });}
        
        }else {
            return res.render('error',{
                message: 'Account does not exist. Please SignUp',
                code:'signup'
               });
           }  
    })
});


app.post("/review",function(req,res){
    const {n1,review}=req.body;
    db.query('INSERT INTO review SET ?',{
        name: n1,
        review: review
    },function(error,result){
        if(error){
            console.log(error);
        }
        else{
            console.log(result); 
            return res.redirect("/");
        }
     })
})

app.post("/skills",redirectULogin,function(req,res){
    const email = req.session.email;
    const {one,two,three,four,five} = req.body;
    const data = {
        email: email,
        one: one || null,
        two: two || null,
        three: three || null,
        four: four || null,
        five: five || null
    };
    db.query(
        'INSERT INTO skills SET ? ON DUPLICATE KEY UPDATE one=VALUES(one),two=VALUES(two),three=VALUES(three),four=VALUES(four),five=VALUES(five)',
        [data],
        function(error,result){
            if(error){
                console.log(error);
                return res.render('error',{message:'Failed to save skills',code:'skills'});
            }
            return res.render('success',{message:'Skills saved successfully',code:'home'});
        }
    );
})


app.post("/nacad",redirectULogin,function(req,res){
    const email = req.session.email;
    const {p1,p2,p3,p4,cp1,cp2,cpa1,cpa2,cpa3,ha1,ha2,cca1,cca2,cca3,cca4,cca5,i1,i2,doc,reason} = req.body;
    
    const proposedData = JSON.stringify({
        p1: p1 || null, p2: p2 || null, p3: p3 || null, p4: p4 || null,
        cp1: cp1 || null, cp2: cp2 || null,
        cpa1: cpa1 || null, cpa2: cpa2 || null, cpa3: cpa3 || null,
        ha1: ha1 || null, ha2: ha2 || null,
        cca1: cca1 || null, cca2: cca2 || null, cca3: cca3 || null, cca4: cca4 || null, cca5: cca5 || null,
        i1: i1 || null, i2: i2 || null
    });
    
    // Delete any existing pending request for same type, then insert new one
    db.query('DELETE FROM change_requests WHERE email = ? AND req_type = "non_academic" AND status = "pending"', [email], function(err){
        if(err) console.log(err);
        db.query('INSERT INTO change_requests SET ?', {
            email: email,
            req_type: 'non_academic',
            proposed_data: proposedData,
            reason: reason || 'No reason provided',
            doc_link: doc || null
        }, function(error, result){
            if(error){
                console.log(error);
                return res.render('error',{message:'Failed to submit changes',code:'home'});
            }
            // Notify admin
            db.query('INSERT INTO notifications SET ?', {
                recipient: 'admin',
                type: 'new_request',
                title: 'New Change Request',
                message: email + ' submitted non-academic detail changes: "' + (reason || '') + '"',
                link: '/admin/review/' + result.insertId
            }, function(err){ if(err) console.log(err); });
            
            return res.render('success',{message:'Changes submitted for admin review. You will be notified once reviewed.',code:'home'});
        });
    });
})



app.post("/acad",redirectULogin,function(req,res){
    const email = req.session.email;
    const {c1,c2,c3,c4,aw1,aw2,aw3,pap1,pap2,pap3,cur_cgpa,backlogs,doc,reason}=req.body; 
    
    const proposedData = JSON.stringify({
        C1: c1 || null, C2: c2 || null, C3: c3 || null, C4: c4 || null,
        aw1: aw1 || null, aw2: aw2 || null, aw3: aw3 || null,
        pap1: pap1 || null, pap2: pap2 || null, pap3: pap3 || null,
        cur_cgpa: cur_cgpa || null,
        backlogs: backlogs || 0
    });
    
    // Delete any existing pending request for same type, then insert new one
    db.query('DELETE FROM change_requests WHERE email = ? AND req_type = "academic" AND status = "pending"', [email], function(err){
        if(err) console.log(err);
        db.query('INSERT INTO change_requests SET ?', {
            email: email,
            req_type: 'academic',
            proposed_data: proposedData,
            reason: reason || 'No reason provided',
            doc_link: doc || null
        }, function(error, result){
            if(error){
                console.log(error);
                return res.render('error',{message:'Failed to submit changes',code:'home'});
            }
            // Notify admin
            db.query('INSERT INTO notifications SET ?', {
                recipient: 'admin',
                type: 'new_request',
                title: 'New Change Request',
                message: email + ' submitted academic detail changes: "' + (reason || '') + '"',
                link: '/admin/review/' + result.insertId
            }, function(err){ if(err) console.log(err); });
            
            return res.render('success',{message:'Changes submitted for admin review. You will be notified once reviewed.',code:'home'});
        });
    });
})
    

app.post("/sb",function(req,res){
    const email = req.session.email;
    const { name, role, ten_marks, twelve_marks , address , phone, about_me,
         cur_sem, branch, linkedin, github} = req.body;
         console.log(req.body);
    db.query('SELECT * from student_basic WHERE email = ?',[email],function(err,result)
    {
        if(err) {
            console.log(err);
        }
        if(result.length > 0){
           return db.query('UPDATE student_basic SET ? WHERE email= ?',[{
                name: name,
                role: role,
                ten_marks: ten_marks,
                twelve_marks: twelve_marks,
                address: address,
                phone: phone,
                about_me: about_me,
                cur_sem: cur_sem,
                branch: branch,
                linkedin: linkedin,
                github: github,
                batch: getBatchFromEmail(email)
             },req.session.email],function(error,result){
                if(error){
                    console.log(error);
                }
                else{
                    console.log(result); 
                    return res.redirect("/home");
                }
             });
        }
        db.query('INSERT INTO student_basic SET ?',{
            name: name,
            email: email,
            role: role,
            ten_marks: ten_marks,
            twelve_marks: twelve_marks,
            address: address,
            phone: phone,
            about_me: about_me,
            cur_sem: cur_sem,
            branch: branch,
            linkedin: linkedin,
            github: github,
            batch: getBatchFromEmail(email)
         },function(error,result){
            if(error){
                console.log(error);
            }
            else{
                db.query('INSERT INTO academic_details SET ?',{
                    email: email
                },function(error,result){
                    if(error){
                        console.log(error);
                    }
                    else{
                        db.query('INSERT INTO non_academic_details SET ?',{
                            email: email,
                        },function(error,result){
                            if(error){
                                console.log(error);
                            }
                            else{
                                db.query('INSERT INTO skills SET ?',{
                                    email: email,
                                },function(error,result){
                                    if(error){
                                        console.log(error);
                                    }
                                    else{
                                        console.log(result); 
                                        return res.redirect("/home");
                                    }
                                 })
                            }
                         })
                    }
                 })
            }
         })
    })
})



app.get("/du",redirectULogin,function(req,res){
    const email = req.session.email;
    db.query('DELETE from student_credentials WHERE email = ?',[email],function(err,result)
        {
            if(err) {
                console.log(err);
            }
            else{
                return res.render('index',{message:''});
            }
        })
})

app.get("/reseta",redirectULogin,function(req,res){
    const email = req.session.email;
    db.query('DELETE from academic_details WHERE email = ?',[email],function(err,result)
        {
            if(err) {
                console.log(err);
            }
            else{
                db.query('INSERT INTO academic_details SET ?',{
                    email: email,
                },function(error,result){
                    if(error){
                        console.log(error);
                    }
                    else{
                        console.log(result); 
                        return res.redirect("/home");
                    }
                 })
            }
        })
})


app.get("/resetna",redirectULogin,function(req,res){
    const email = req.session.email;
    db.query('DELETE from non_academic_details WHERE email = ?',[email],function(err,result)
        {
            if(err) {
                console.log(err);
            }
            else{
                db.query('INSERT INTO non_academic_details SET ?',{
                    email: email,
                },function(error,result){
                    if(error){
                        console.log(error);
                    }
                    else{
                        console.log(result); 
                        return res.redirect("/home");
                    }
                 })
            }
        })
})

// ==========================================
// ADMIN – Review Change Requests
// ==========================================

// Admin: View all change requests (with filter)
app.get("/admin/review", redirectALogin, function(req,res){
    var statusFilter = req.query.status || 'pending';
    var query = 'SELECT cr.*, sb.name as student_name FROM change_requests cr LEFT JOIN student_basic sb ON cr.email = sb.email';
    var params = [];
    if(statusFilter !== 'all'){
        query += ' WHERE cr.status = ?';
        params.push(statusFilter);
    }
    query += ' ORDER BY cr.created_at DESC';
    
    db.query(query, params, function(err, requests){
        if(err) console.log(err);
        return res.render('admin_review', { requests: requests || [], statusFilter: statusFilter });
    });
});

// Admin: View single request with diff
app.get("/admin/review/:id", redirectALogin, function(req,res){
    var requestId = req.params.id;
    db.query('SELECT cr.*, sb.name as student_name FROM change_requests cr LEFT JOIN student_basic sb ON cr.email = sb.email WHERE cr.id = ?', [requestId], function(err, result){
        if(err || result.length === 0){
            return res.render('error',{message:'Request not found',code:'admin/review'});
        }
        var request = result[0];
        var table = request.req_type === 'academic' ? 'academic_details' : 'non_academic_details';
        
        db.query('SELECT * FROM ' + table + ' WHERE email = ?', [request.email], function(err, currentData){
            if(err) console.log(err);
            return res.render('admin_review_detail', {
                request: request,
                currentData: (currentData && currentData[0]) || {},
                proposedData: JSON.parse(request.proposed_data)
            });
        });
    });
});

app.post("/valid",redirectALogin,function(req,res){
    const id = req.body.id;
    db.query('SELECT * FROM change_requests WHERE id = ? AND status = "pending"', [id], function(err, result){
        if(err || result.length === 0){
            return res.render('error',{message:'Request not found or already reviewed',code:'adminlog'});
        }
        const request = result[0];
        const proposed = JSON.parse(request.proposed_data);
        const email = request.email;
        const table = request.req_type === 'academic' ? 'academic_details' : 'non_academic_details';
        
        // Apply the proposed changes to the actual table
        proposed.email = email;
        db.query(
            'INSERT INTO ' + table + ' SET ? ON DUPLICATE KEY UPDATE ' + 
            Object.keys(proposed).filter(function(k){ return k !== 'email'; }).map(function(k){ return '`' + k + '`=VALUES(`' + k + '`)'; }).join(','),
            [proposed],
            function(err){
                if(err){
                    console.log(err);
                    return res.render('error',{message:'Failed to apply changes',code:'adminlog'});
                }
                // Update request status
                db.query('UPDATE change_requests SET status = "approved", reviewed_at = NOW() WHERE id = ?', [id], function(err){
                    if(err) console.log(err);
                    // Notify student
                    db.query('INSERT INTO notifications SET ?', {
                        recipient: email,
                        type: 'approved',
                        title: 'Changes Approved',
                        message: 'Your ' + request.req_type.replace('_',' ') + ' changes have been approved and applied to your profile.',
                        link: '/home'
                    }, function(err){ if(err) console.log(err); });
                    
                    sendMail(email, 'Changes Approved – IIITAPfolio', 
                        'Dear Student,<br><br>Your request to update <b>' + request.req_type.replace('_',' ') + ' details</b> has been <b style="color:green;">approved</b>.<br>Reason you provided: "' + request.reason + '"<br><br>Your profile has been updated. Log in to verify.');
                    
                    return res.redirect('/adminlog#change-requests');
                });
            }
        );
    });
})


app.post("/decline",redirectALogin,function(req,res){
    const {id, admin_remarks} = req.body;
    db.query('SELECT * FROM change_requests WHERE id = ? AND status = "pending"', [id], function(err, result){
        if(err || result.length === 0){
            return res.render('error',{message:'Request not found or already reviewed',code:'adminlog'});
        }
        const request = result[0];
        const email = request.email;
        
        // Update request status with admin remarks
        db.query('UPDATE change_requests SET status = "rejected", admin_remarks = ?, reviewed_at = NOW() WHERE id = ?', 
            [admin_remarks || 'No reason provided', id], function(err){
            if(err) console.log(err);
            // Notify student
            db.query('INSERT INTO notifications SET ?', {
                recipient: email,
                type: 'rejected',
                title: 'Changes Rejected',
                message: 'Your ' + request.req_type.replace('_',' ') + ' changes were rejected. Reason: "' + (admin_remarks || 'No reason provided') + '"',
                link: request.req_type === 'academic' ? '/acad' : '/nacad'
            }, function(err){ if(err) console.log(err); });
            
            sendMail(email, 'Changes Rejected – IIITAPfolio', 
                'Dear Student,<br><br>Your request to update <b>' + request.req_type.replace('_',' ') + ' details</b> has been <b style="color:red;">rejected</b>.<br>Admin remarks: "' + (admin_remarks || 'No reason provided') + '"<br>Your reason: "' + request.reason + '"<br><br>Please correct and resubmit if needed.');
            
            return res.redirect('/adminlog#change-requests');
        });
    });
})

// ==========================================
// NOTIFICATIONS
// ==========================================

// Get notifications for logged-in user (student or admin)
app.get("/notifications", function(req,res){
    var recipient;
    if(req.session.loggedinadmin){
        recipient = 'admin';
    } else if(req.session.loggedin){
        recipient = req.session.email;
    } else {
        return res.json({ notifications: [], unreadCount: 0 });
    }
    db.query('SELECT * FROM notifications WHERE recipient = ? ORDER BY created_at DESC LIMIT 20', [recipient], function(err, notifs){
        if(err){ console.log(err); return res.json({ notifications: [], unreadCount: 0 }); }
        var unreadCount = notifs.filter(function(n){ return !n.is_read; }).length;
        return res.json({ notifications: notifs, unreadCount: unreadCount });
    });
});

// Mark notification as read
app.post("/notifications/read", function(req,res){
    var id = req.body.id;
    db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id], function(err){
        if(err) console.log(err);
        return res.json({ success: true });
    });
});

// Mark all notifications as read
app.post("/notifications/read-all", function(req,res){
    var recipient;
    if(req.session.loggedinadmin) recipient = 'admin';
    else if(req.session.loggedin) recipient = req.session.email;
    else return res.json({ success: false });
    
    db.query('UPDATE notifications SET is_read = 1 WHERE recipient = ? AND is_read = 0', [recipient], function(err){
        if(err) console.log(err);
        return res.json({ success: true });
    });
});

// Student: View request history
app.get("/my-requests", redirectULogin, function(req,res){
    var email = req.session.email;
    var status = req.query.status;
    var sql = 'SELECT * FROM change_requests WHERE email = ?';
    var params = [email];
    if(status && ['pending','approved','rejected'].includes(status)){
        sql += ' AND status = ?';
        params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    db.query(sql, params, function(err, requests){
        if(err) console.log(err);
        return res.render('my_requests', { requests: requests || [], status: status || null });
    });
});

// ==========================================
// PLACEMENT DRIVES – Student Routes
// ==========================================

// Student: View all placement drives
app.get("/placements", redirectULogin, function(req,res){
    const email = req.session.email;
    // Get student's branch, cgpa, backlogs
    db.query('SELECT branch FROM student_basic WHERE email = ?', [email], function(err, basicRes){
        if(err || basicRes.length === 0){
            return res.render('error',{message:'Complete your basic details first',code:'sb'});
        }
        db.query('SELECT cur_cgpa, backlogs FROM academic_details WHERE email = ?', [email], function(err, acadRes){
            if(err) console.log(err);
            const studentBranch = basicRes[0].branch;
            const studentCgpa = acadRes && acadRes[0] ? parseFloat(acadRes[0].cur_cgpa) || 0 : 0;
            const studentBacklogs = acadRes && acadRes[0] ? parseInt(acadRes[0].backlogs) || 0 : 0;
            
            // Get all active/upcoming drives with company info
            db.query(`SELECT pd.*, c.name as company_name, c.website as company_website, c.logo_url,
                      (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as applicant_count,
                      (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND email = ?) as already_applied
                      FROM placement_drives pd 
                      JOIN companies c ON pd.company_id = c.id 
                      WHERE pd.status IN ('active','upcoming')
                      ORDER BY pd.drive_date ASC`, [email], function(err, drives){
                if(err) console.log(err);
                
                // Get student's applications
                db.query(`SELECT a.*, pd.role, c.name as company_name, pd.package_lpa, pd.drive_date
                          FROM applications a
                          JOIN placement_drives pd ON a.drive_id = pd.id
                          JOIN companies c ON pd.company_id = c.id
                          WHERE a.email = ?
                          ORDER BY a.applied_at DESC`, [email], function(err, myApps){
                    if(err) console.log(err);
                    
                    return res.render('placements', {
                        drives: drives || [],
                        myApplications: myApps || [],
                        studentBranch: studentBranch,
                        studentCgpa: studentCgpa,
                        studentBacklogs: studentBacklogs
                    });
                });
            });
        });
    });
});

// Student: Apply to a drive
app.post("/apply", redirectULogin, function(req,res){
    const email = req.session.email;
    const driveId = req.body.drive_id;
    
    // Verify eligibility before applying
    db.query('SELECT branch FROM student_basic WHERE email = ?', [email], function(err, basicRes){
        if(err || basicRes.length === 0){
            return res.render('error',{message:'Complete your basic details first',code:'sb'});
        }
        db.query('SELECT cur_cgpa, backlogs FROM academic_details WHERE email = ?', [email], function(err, acadRes){
            if(err) console.log(err);
            const studentBranch = basicRes[0].branch;
            const studentCgpa = acadRes && acadRes[0] ? parseFloat(acadRes[0].cur_cgpa) || 0 : 0;
            const studentBacklogs = acadRes && acadRes[0] ? parseInt(acadRes[0].backlogs) || 0 : 0;
            
            db.query('SELECT * FROM placement_drives WHERE id = ?', [driveId], function(err, driveRes){
                if(err || driveRes.length === 0){
                    return res.render('error',{message:'Drive not found',code:'placements'});
                }
                const drive = driveRes[0];
                const eligibleBranches = drive.eligible_branches.split(',').map(function(b){ return b.trim(); });
                
                if(!eligibleBranches.includes(studentBranch)){
                    return res.render('error',{message:'Your branch is not eligible for this drive',code:'placements'});
                }
                if(studentCgpa < parseFloat(drive.min_cgpa)){
                    return res.render('error',{message:'Your CGPA does not meet the minimum requirement of '+drive.min_cgpa,code:'placements'});
                }
                if(studentBacklogs > drive.max_backlogs){
                    return res.render('error',{message:'You have more backlogs than allowed (max: '+drive.max_backlogs+')',code:'placements'});
                }
                if(drive.status !== 'active'){
                    return res.render('error',{message:'This drive is not currently accepting applications',code:'placements'});
                }
                
                db.query('INSERT INTO applications SET ?', {
                    drive_id: driveId,
                    email: email,
                    status: 'applied'
                }, function(err, result){
                    if(err){
                        if(err.code === 'ER_DUP_ENTRY'){
                            return res.render('error',{message:'You have already applied to this drive',code:'placements'});
                        }
                        console.log(err);
                        return res.render('error',{message:'Failed to apply',code:'placements'});
                    }
                    return res.render('success',{message:'Successfully applied! You will be notified about your status.',code:'placements'});
                });
            });
        });
    });
});

// ==========================================
// ADMIN – Company Management
// ==========================================

app.get("/admin/companies", redirectALogin, function(req,res){
    db.query('SELECT * FROM companies ORDER BY name', function(err, companies){
        if(err) console.log(err);
        return res.render('admin_companies', { companies: companies || [] });
    });
});

app.post("/admin/companies", redirectALogin, function(req,res){
    const {name, website, description} = req.body;
    db.query('INSERT INTO companies SET ?', {
        name: name,
        website: website || null,
        description: description || null
    }, function(err, result){
        if(err){
            console.log(err);
            return res.render('error',{message:'Failed to add company',code:'admin/companies'});
        }
        return res.redirect('/adminlog#companies');
    });
});

app.post("/admin/companies/delete", redirectALogin, function(req,res){
    const id = req.body.id;
    db.query('DELETE FROM companies WHERE id = ?', [id], function(err){
        if(err) console.log(err);
        return res.redirect('/adminlog#companies');
    });
});

// Add new admin
app.post("/admin/add-admin", redirectALogin, function(req,res){
    const { username, email, password, securityq } = req.body;
    if(!username || !email || !password || !securityq){
        return res.json({success: false, message: 'All fields are required.'});
    }
    db.query('SELECT email FROM admin_credentials WHERE email = ?', [email], function(err, existing){
        if(err){
            console.log(err);
            return res.json({success: false, message: 'Database error.'});
        }
        if(existing && existing.length > 0){
            return res.json({success: false, message: 'An admin with this email already exists.'});
        }
        db.query('INSERT INTO admin_credentials (UserName, email, Password, Securityq) VALUES (?, ?, ?, ?)',
            [username, email, password, securityq], function(err2){
            if(err2){
                console.log(err2);
                return res.json({success: false, message: 'Failed to create admin.'});
            }
            return res.json({success: true, message: 'Admin created successfully! They can now log in.'});
        });
    });
});

// Student: AI resume check for a specific eligible drive
app.post("/resume-analyzer", redirectULogin, handleResumeUpload, async function(req,res){
    const email = req.session.email;
    const driveId = req.body.drive_id;
    let selectedDrive = null;

    if(!req.file){
        return res.render('error',{message:'Please upload your resume PDF.',code:'placements'});
    }

    try {
        const [[basic]] = await db.promise().query('SELECT branch FROM student_basic WHERE email = ?', [email]);
        if(!basic){
            return res.render('error',{message:'Complete your basic details first',code:'sb'});
        }

        const [[acad]] = await db.promise().query('SELECT cur_cgpa, backlogs FROM academic_details WHERE email = ?', [email]);
        const studentBranch = basic.branch;
        const studentCgpa = acad ? parseFloat(acad.cur_cgpa) || 0 : 0;
        const studentBacklogs = acad ? parseInt(acad.backlogs) || 0 : 0;

        const [[drive]] = await db.promise().query(`SELECT pd.*, c.name as company_name, c.website as company_website
            FROM placement_drives pd
            JOIN companies c ON pd.company_id = c.id
            WHERE pd.id = ?`, [driveId]);
        selectedDrive = drive || null;

        if(!drive){
            return res.render('error',{message:'Drive not found',code:'placements'});
        }

        const eligibleBranches = drive.eligible_branches.split(',').map(function(b){ return b.trim(); });
        const isEligible = eligibleBranches.includes(studentBranch) &&
            studentCgpa >= parseFloat(drive.min_cgpa) &&
            studentBacklogs <= drive.max_backlogs &&
            drive.status === 'active';

        if(!isEligible){
            return res.render('error',{message:'Resume analyzer is available only for active drives where you are eligible.',code:'placements'});
        }

        const result = await analyzeResumePdf(req.file, {
            company_name: drive.company_name,
            role: drive.role,
            package_lpa: drive.package_lpa,
            description: drive.description,
            eligible_branches: drive.eligible_branches,
            min_cgpa: drive.min_cgpa,
            max_backlogs: drive.max_backlogs,
            studentBranch: studentBranch,
            studentCgpa: studentCgpa,
            studentBacklogs: studentBacklogs
        });

        const modelLabel = result._source === 'gemini'
            ? ('Gemini ' + (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'))
            : 'Local Analysis (AI unavailable)';

        return res.render('resume_analysis', {
            result: result,
            drive: drive,
            fileName: req.file.originalname,
            modelName: modelLabel
        });
    } catch(err) {
        console.log(err);
        return res.render('resume_analysis', {
            result: null,
            drive: selectedDrive,
            fileName: req.file ? req.file.originalname : '',
            modelName: 'Resume Analyzer',
            error: err.message || 'Unable to analyze the resume right now.'
        });
    }
});

// ==========================================
// ADMIN – Placement Drive Management
// ==========================================

app.get("/admin/drives", redirectALogin, function(req,res){
    db.query(`SELECT pd.*, c.name as company_name,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as applicant_count
              FROM placement_drives pd 
              JOIN companies c ON pd.company_id = c.id 
              ORDER BY pd.created_at DESC`, function(err, drives){
        if(err) console.log(err);
        db.query('SELECT id, name FROM companies ORDER BY name', function(err, companies){
            if(err) console.log(err);
            return res.render('admin_drives', { drives: drives || [], companies: companies || [] });
        });
    });
});

app.post("/admin/drives", redirectALogin, function(req,res){
    const {company_id, role, package_lpa, description, min_cgpa, max_backlogs, eligible_branches, drive_date, last_date_apply, status} = req.body;
    const branches = Array.isArray(eligible_branches) ? eligible_branches.join(',') : eligible_branches;
    db.query('INSERT INTO placement_drives SET ?', {
        company_id: company_id,
        role: role,
        package_lpa: package_lpa || null,
        description: description || null,
        min_cgpa: min_cgpa || 0,
        max_backlogs: max_backlogs || 0,
        eligible_branches: branches || 'IT,ECE,IT-BI',
        drive_date: drive_date || null,
        last_date_apply: last_date_apply || null,
        status: status || 'upcoming'
    }, function(err, result){
        if(err){
            console.log(err);
            return res.render('error',{message:'Failed to create drive',code:'admin/drives'});
        }
        return res.redirect('/adminlog#drives');
    });
});

app.post("/admin/drives/status", redirectALogin, function(req,res){
    const {id, status} = req.body;
    db.query('UPDATE placement_drives SET status = ? WHERE id = ?', [status, id], function(err){
        if(err) console.log(err);
        return res.redirect('/adminlog#drives');
    });
});

app.post("/admin/drives/delete", redirectALogin, function(req,res){
    const id = req.body.id;
    db.query('DELETE FROM placement_drives WHERE id = ?', [id], function(err){
        if(err) console.log(err);
        return res.redirect('/adminlog#drives');
    });
});

// ==========================================
// ADMIN – View Applicants for a Drive
// ==========================================

app.get("/admin/drives/:id/applicants", redirectALogin, function(req,res){
    const driveId = req.params.id;
    db.query(`SELECT pd.*, c.name as company_name FROM placement_drives pd 
              JOIN companies c ON pd.company_id = c.id WHERE pd.id = ?`, [driveId], function(err, driveRes){
        if(err || driveRes.length === 0){
            return res.render('error',{message:'Drive not found',code:'admin/drives'});
        }
        db.query(`SELECT a.*, sb.name, sb.branch, sb.phone, ad.cur_cgpa, ad.backlogs
                  FROM applications a
                  JOIN student_basic sb ON a.email = sb.email
                  LEFT JOIN academic_details ad ON a.email = ad.email
                  WHERE a.drive_id = ?
                  ORDER BY ad.cur_cgpa DESC`, [driveId], function(err, applicants){
            if(err) console.log(err);
            return res.render('admin_applicants', {
                drive: driveRes[0],
                applicants: applicants || []
            });
        });
    });
});

app.post("/admin/applicant/status", redirectALogin, function(req,res){
    const {app_id, status, drive_id} = req.body;
    db.query('UPDATE applications SET status = ? WHERE id = ?', [status, app_id], function(err){
        if(err) console.log(err);
        // Notify the student
        db.query('SELECT email FROM applications WHERE id = ?', [app_id], function(err, appRes){
            if(!err && appRes.length > 0){
                var msg = '';
                if(status === 'shortlisted') msg = 'Congratulations! You have been shortlisted.';
                else if(status === 'selected') msg = 'Congratulations! You have been selected!';
                else if(status === 'rejected') msg = 'We regret to inform you that your application was not successful.';
                if(msg) sendMail(appRes[0].email, 'Placement Application Update', msg);
            }
        });
        return res.redirect('/admin/drives/'+drive_id+'/applicants');
    });
});

// ==========================================
// ADMIN – Student Filtering & Analytics
// ==========================================

app.get("/admin/students", redirectALogin, function(req,res){
    const {min_cgpa, max_backlogs, branch} = req.query;
    
    var query = `SELECT sb.*, ad.cur_cgpa, ad.backlogs 
                 FROM student_basic sb 
                 LEFT JOIN academic_details ad ON sb.email = ad.email 
                 WHERE 1=1`;
    var params = [];
    
    if(min_cgpa){
        query += ' AND CAST(ad.cur_cgpa AS DECIMAL(4,2)) >= ?';
        params.push(parseFloat(min_cgpa));
    }
    if(max_backlogs !== undefined && max_backlogs !== ''){
        query += ' AND (ad.backlogs IS NULL OR ad.backlogs <= ?)';
        params.push(parseInt(max_backlogs));
    }
    if(branch && branch !== 'all'){
        query += ' AND sb.branch = ?';
        params.push(branch);
    }
    query += ' ORDER BY CAST(ad.cur_cgpa AS DECIMAL(4,2)) DESC';
    
    db.query(query, params, function(err, students){
        if(err) console.log(err);
        
        // Get analytics data
        db.query(`SELECT sb.branch, COUNT(*) as count, 
                  ROUND(AVG(CAST(ad.cur_cgpa AS DECIMAL(4,2))),2) as avg_cgpa
                  FROM student_basic sb 
                  LEFT JOIN academic_details ad ON sb.email = ad.email 
                  GROUP BY sb.branch`, function(err, branchStats){
            if(err) console.log(err);
            
            db.query(`SELECT pd.status, COUNT(*) as count FROM placement_drives pd GROUP BY pd.status`, function(err, driveStats){
                if(err) console.log(err);
                
                db.query(`SELECT a.status, COUNT(*) as count FROM applications a GROUP BY a.status`, function(err, appStats){
                    if(err) console.log(err);
                    
                    db.query(`SELECT COUNT(*) as total FROM student_basic`, function(err, totalRes){
                        if(err) console.log(err);
                        
                        db.query(`SELECT COUNT(DISTINCT email) as placed FROM applications WHERE status = 'selected'`, function(err, placedRes){
                            if(err) console.log(err);
                            
                            return res.render('admin_students', {
                                students: students || [],
                                filters: { min_cgpa: min_cgpa || '', max_backlogs: max_backlogs !== undefined ? max_backlogs : '', branch: branch || 'all' },
                                branchStats: branchStats || [],
                                driveStats: driveStats || [],
                                appStats: appStats || [],
                                totalStudents: totalRes && totalRes[0] ? totalRes[0].total : 0,
                                placedStudents: placedRes && placedRes[0] ? placedRes[0].placed : 0
                            });
                        });
                    });
                });
            });
        });
    });
});

// server run 
app.listen(PORT,function(){
    console.log("Server started on port "+PORT);
});
