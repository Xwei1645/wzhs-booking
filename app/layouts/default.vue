<template>
  <t-layout class="app-layout">
    <t-header class="app-header">
      <div class="logo-container">
        <span class="logo-text">Lattice Campus</span>
      </div>
      <t-head-menu theme="light" value="item1" class="header-menu">
        <template #operations>
          <div class="user-info-header">
            <t-tag theme="primary" variant="light" class="role-tag">{{ getRoleName(userInfo?.role) }}</t-tag>
            <t-dropdown trigger="click" @click="handleDropdownClick">
              <t-link theme="default" class="user-name-link">
                <span class="user-name-text">{{ userInfo?.name }} ({{ userInfo?.account }})</span>
              </t-link>
              <t-dropdown-menu>
                <t-dropdown-item value="edit-name">修改姓名</t-dropdown-item>
                <t-dropdown-item value="edit-password">修改密码</t-dropdown-item>
                <t-dropdown-item value="logout">退出登录</t-dropdown-item>
              </t-dropdown-menu>
            </t-dropdown>
          </div>
        </template>
      </t-head-menu>
    </t-header>
    <t-layout>
      <t-aside class="app-aside">
        <t-menu theme="light" :value="$route.path" collapsed @change="handleMenuClick">
          <t-menu-item value="/" to="/">
            <template #icon><home-icon /></template>
            首页
          </t-menu-item>
          <t-menu-item v-if="isAdmin" value="/account-management" to="/account-management">
            <template #icon><user-setting-icon /></template>
            账户管理
          </t-menu-item>
          <t-menu-item v-if="isAdmin" value="/organization-management" to="/organization-management">
            <template #icon><usergroup-icon /></template>
            组织管理
          </t-menu-item>
        </t-menu>
      </t-aside>
      <t-layout>
        <t-content class="app-content">
          <slot />
        </t-content>
        <t-footer class="app-footer">
          ©Xwei1645 2025 All Rights Reserved.
        </t-footer>
      </t-layout>
    </t-layout>

    <!-- 修改姓名对话框 -->
    <t-dialog
      v-model:visible="nameVisible"
      header="修改姓名"
      :footer="false"
      width="450px"
    >
      <t-form :data="nameData" :rules="nameRules" label-align="top" @submit="onNameSubmit">
        <t-form-item label="姓名" name="name">
          <t-input v-model="nameData.name" placeholder="请输入新姓名" />
        </t-form-item>
        <t-form-item style="margin-top: 24px">
          <div style="display: flex; justify-content: flex-end; width: 100%; gap: 12px">
            <t-button variant="outline" @click="nameVisible = false">取消</t-button>
            <t-button theme="primary" type="submit">保存修改</t-button>
          </div>
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 修改密码对话框 -->
    <t-dialog
      v-model:visible="passwordVisible"
      header="修改密码"
      :footer="false"
      width="450px"
    >
      <t-form :data="passwordData" :rules="passwordRules" label-align="top" @submit="onPasswordSubmit">
        <t-form-item label="旧密码" name="oldPassword">
          <t-input v-model="passwordData.oldPassword" type="password" placeholder="请输入旧密码" />
        </t-form-item>
        <t-form-item label="新密码" name="newPassword">
          <t-input v-model="passwordData.newPassword" type="password" placeholder="请输入新密码" />
        </t-form-item>
        <t-form-item label="确认新密码" name="confirmPassword">
          <t-input v-model="passwordData.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </t-form-item>
        <t-form-item style="margin-top: 24px">
          <div style="display: flex; justify-content: flex-end; width: 100%; gap: 12px">
            <t-button variant="outline" @click="passwordVisible = false">取消</t-button>
            <t-button theme="primary" type="submit">修改密码</t-button>
          </div>
        </t-form-item>
      </t-form>
    </t-dialog>
  </t-layout>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { HomeIcon, UserSettingIcon, LogoutIcon, UsergroupIcon } from 'tdesign-icons-vue-next';

const route = useRoute();
const router = useRouter();

const userInfo = useCookie<any>('userInfo');

const isAdmin = computed(() => {
  const role = userInfo.value?.role;
  return role === 'admin' || role === 'super_admin';
});

// 修改姓名逻辑
const nameVisible = ref(false);
const nameData = reactive({
  name: '',
});

const nameRules: any = {
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
};

// 修改密码逻辑
const passwordVisible = ref(false);
const passwordData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordRules: any = {
  oldPassword: [{ required: true, message: '旧密码不能为空', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (val: string) => val === passwordData.newPassword,
      message: '两次输入的密码不一致',
      trigger: 'blur',
    },
  ],
};

const getRoleName = (role: string) => {
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    user: '普通账户',
  };
  return map[role] || role;
};

const handleDropdownClick = (data: any) => {
  if (data.value === 'logout') {
    handleLogout();
  } else if (data.value === 'edit-name') {
    nameData.name = userInfo.value.name;
    nameVisible.value = true;
  } else if (data.value === 'edit-password') {
    passwordData.oldPassword = '';
    passwordData.newPassword = '';
    passwordData.confirmPassword = '';
    passwordVisible.value = true;
  }
};

const onNameSubmit = async ({ validateResult, firstError }: any) => {
  if (validateResult === true) {
    try {
      const response: any = await $fetch('/api/auth/update-profile', {
        method: 'POST',
        body: {
          id: userInfo.value.id,
          name: nameData.name,
        }
      });

      const updatedUser = { ...userInfo.value, name: response.name };
      userInfo.value = updatedUser;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      MessagePlugin.success('姓名修改成功');
      nameVisible.value = false;
    } catch (error: any) {
      MessagePlugin.error(error.data?.statusMessage || '修改失败');
    }
  } else {
    MessagePlugin.error(firstError);
  }
};

const onPasswordSubmit = async ({ validateResult, firstError }: any) => {
  if (validateResult === true) {
    try {
      await $fetch('/api/auth/update-profile', {
        method: 'POST',
        body: {
          id: userInfo.value.id,
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        }
      });

      MessagePlugin.success('密码修改成功');
      passwordVisible.value = false;
    } catch (error: any) {
      MessagePlugin.error(error.data?.statusMessage || '修改失败');
    }
  } else {
    MessagePlugin.error(firstError);
  }
};

const handleLogout = () => {
  userInfo.value = null;
  localStorage.removeItem('user');
  navigateTo('/login');
};

const handleMenuClick = (value: any) => {
  router.push(value);
};
</script>

<style>
.app-layout {
  height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background-color: #fff;
  border-bottom: 1px solid var(--td-component-border);
  z-index: 100;
}

.logo-container {
  width: 200px;
  font-size: 20px;
  font-weight: bold;
  color: var(--td-brand-color);
}

.header-menu {
  flex: 1;
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 8px;
}

.role-tag {
  margin-right: 4px;
}

.user-name-text {
  font-size: 14px;
  color: var(--td-text-color-primary);
}

.app-aside {
  border-right: 1px solid var(--td-component-border);
}

.app-content {
  padding: 0;
  background-color: var(--td-bg-color-page);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.app-content > div {
  flex: 1;
}

.app-footer {
  padding: 16px;
  text-align: center;
  color: var(--td-text-color-placeholder);
  background-color: var(--td-bg-color-page);
  font-size: 12px;
}

/* 移除默认 margin */
body {
  margin: 0;
}
</style>
