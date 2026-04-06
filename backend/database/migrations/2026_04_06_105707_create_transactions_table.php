<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['commission', 'payout'])->default('commission');
            $table->decimal('amount', 15, 2);
            $table->string('status')->default('completed'); // paid, pending, cancelled
            $table->string('source')->nullable(); // Summer Campaign, Direct Deposit, etc.
            $table->string('reference_id')->nullable(); // external ID (sale, order, payout batch)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
