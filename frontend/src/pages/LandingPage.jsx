import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Building,
  ArrowRight,
  BookOpen,
  Landmark,
  CreditCard,
  FileCheck2,
  CheckCircle2,
  PhoneCall,
  MapPin,
  ExternalLink,
  Users
} from 'lucide-react';
import campusImg from '../assets/mu-campus-1.jpg';
import logoImg from '../assets/mu-logo-white.png';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-400 selection:text-slate-900">
      {/* Hero Section with Official Metropolitan University Campus Photo */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Elegant Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={campusImg}
            alt="Metropolitan University Bateshwar Campus"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-[#0f2b5c]/70 backdrop-blur-[2px]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 text-center space-y-8">
          {/* Official Badge & Logo */}
          <div className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-xs font-semibold text-amber-300 transition shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Metropolitan University • Sylhet, Bangladesh • Bateshwar Permanent Campus
          </div>

          <div className="space-y-3">
            <div className="flex justify-center mb-4">
              <img src={logoImg} alt="Metropolitan University Logo" className="h-20 w-auto object-contain drop-shadow-xl" />
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
              METROPOLITAN UNIVERSITY
            </h1>
            <p className="text-base sm:text-xl text-blue-100 max-w-3xl mx-auto font-medium">
              Integrated Financial Management, Tuition Waiver & Digital Academic Portal
            </p>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
              Connecting Students, Accounts & Finance, Academic Departments, and Central Administration in a unified digital campus platform.
            </p>
          </div>

          {/* Two Distinct Gateway Entry Portals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-6 text-left">
            {/* Student Portal Gateway */}
            <div className="group bg-gradient-to-br from-slate-900/90 to-blue-950/80 border border-blue-500/30 hover:border-amber-400/80 rounded-3xl p-7 shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-900/30 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-[#0f2b5c] flex items-center justify-center text-white shadow-md">
                    <GraduationCap className="w-8 h-8 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                    Student Access
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-amber-300 transition">
                  Student Portal
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Log in with your official <span className="font-mono text-amber-300 font-bold">Student ID Number</span> to manage 4-installment tuition fees, active waivers, course enrollment papers, admit cards, and clearance.
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-blue-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Transparent Tuition Waiver (10% to 50% Benefit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Course Enrollment Paper & Exam Admit Card PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>NRBC Bank Bateshwar Slip Verification Queue</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <Link
                  to="/student/login"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-[#0f2b5c] hover:from-blue-500 hover:to-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition text-sm group-hover:shadow-blue-500/30"
                >
                  Enter Student Portal
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Administration Portal Gateway */}
            <div className="group bg-gradient-to-br from-slate-900/90 to-purple-950/80 border border-purple-500/30 hover:border-purple-400/80 rounded-3xl p-7 shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-900/30 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-900 flex items-center justify-center text-white shadow-md">
                    <ShieldCheck className="w-8 h-8 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 bg-purple-400/10 border border-purple-400/20 px-3 py-1 rounded-full">
                    Officer / Admin
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-purple-300 transition">
                  Administration Portal
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Dedicated secure gateway for Accounts & Finance Officers, Head of Department, Central Library, and Super Administrators.
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-purple-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Student Management & Programme Fee Structures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Individual Tuition Waiver & Scholarship Grant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Admit Card Eligibility Audits & Admin Overrides</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <Link
                  to="/admin/login"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition text-sm group-hover:shadow-purple-500/30"
                >
                  Enter Administration Portal
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* University Highlights & Key Information */}
      <div className="bg-slate-900 border-t border-slate-800 py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <Landmark className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">NRBC Bank Partner</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Bateshwar Campus Branch</div>
            <div className="text-[10px] font-mono text-amber-400 mt-1">A/C: 015954000000001</div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <CreditCard className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">4 Equal Installments</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Flexible Term Tuition Policy</div>
            <div className="text-[10px] text-emerald-400 mt-1">Deadline: 12th of each month</div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <BookOpen className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">Prof. M. H. Rahman</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Central Library Clearance</div>
            <div className="text-[10px] text-blue-300 mt-1">Integrated Digital Catalog</div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <FileCheck2 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">QR Verification</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tamper-Evident Documents</div>
            <div className="text-[10px] text-purple-300 mt-1">Admit Cards & Certificates</div>
          </div>
        </div>
      </div>

      {/* Institutional Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            © {new Date().getFullYear()} Metropolitan University, Sylhet, Bangladesh. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://metrouni.edu.bd" target="_blank" rel="noreferrer" className="hover:text-white transition flex items-center gap-1">
              Official University Website <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <Link to="/verify" className="hover:text-white transition">Verify Certificate</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

